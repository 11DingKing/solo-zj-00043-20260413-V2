import React, { useState } from "react";
import { useContext, useEffect } from "react";
import { TokenContext } from "../tokenContext";
import { fetchGetHabits, fetchHabitCompletion, fetchUncompleteHabit, fetchGetHabitsByCategory, fetchGetCategories } from "../api_fetching/urlParserMainFucntionality";
import { fetchGetUNIXFromMidnight } from "../api_fetching/urlParserUtils";
import { useNavigate } from "react-router-dom";
import NavBar from "./navBar"
import AddHabitButton from "./addHabitButton";
import DeleteHabit from "./deleteHabit";
import CategorySidebar from "./categorySidebar";
import { minutesToReset } from "../utils/getTimeUntilReset";
import { handleResponseError } from "../utils/handleResponse";
import "../index.css"
import { defineCookiesToken } from "../utils/cookieHandling";
import { defineColorTheme } from "../utils/cookieHandling";

export const Habits = () => {
    const [token, setToken] = defineCookiesToken();
    const [ darkTheme, toggleTheme ] = defineColorTheme();

    const navigate = useNavigate();
    const [habits, setHabits] = useState([]);
    const [categories, setCategories] = useState([]);
    const [refreshHabits, setRefreshHabits] = useState(false);
    const [loading, setLoading] = useState(false);

    const [ UNIXFromMidnight, setUNIXFromMidnight ] = useState(null);

    const [ habitsNumber, setHabitsNumber ] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                try {
                    const response = await fetchGetUNIXFromMidnight(token);
                    const responseJSON = await response.json();
                    const errorFlag = handleResponseError(response, responseJSON, navigate, setToken);
                    if(errorFlag) { return };
                    setUNIXFromMidnight(responseJSON.UNIX_time);
                } catch (err) {
                    console.error(err);
                    navigate("/internal-server-error", { state: {errorMessage: "Server down. Please, try again later"}});
                    return;
                }

                try {
                    const categoriesResponse = await fetchGetCategories(token);
                    if (categoriesResponse.ok) {
                        const categoriesJSON = await categoriesResponse.json();
                        setCategories(categoriesJSON);
                    }
                } catch (err) {
                    console.error("Error fetching categories:", err);
                }

                try {
                    let response;
                    if (selectedCategory === "all") {
                        response = await fetchGetHabits(token);
                    } else {
                        response = await fetchGetHabitsByCategory(selectedCategory, token);
                    }
                    const responseJSON = await response.json();
                    const errorFlag = handleResponseError(response, responseJSON, navigate, setToken);
                    if(errorFlag) { return };

                    let updatedDataWithResetAt = []
                    for(let i = 0; i < responseJSON.length; i++) {
                        let habit = responseJSON[i];
                        const timeString = await getClosestResetTime(habit.reset_at, habit.completed);
                        habit.resetAt = timeString;
                        updatedDataWithResetAt.push(habit);
                        setHabitsNumber(i + 1);
                    };

                    setHabits(updatedDataWithResetAt);
                } catch (err) {
                    console.error(err);
                    navigate("/internal-server-error", { state: {errorMessage: "Server down. Please, try again later"}});
                    return;
                };
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshHabits, navigate, selectedCategory]);

    const checkboxHandler = async (e, habitID, index) => {
        const updatedHabits = [...habits];

        updatedHabits[index].completed = !updatedHabits[index].completed
        setHabits(updatedHabits)
        try {
            if(e.target.checked) {
                const response = await fetchHabitCompletion(habitID, token);
                const responseJSON = await response.json();
                const errorFlag = handleResponseError(response, responseJSON, navigate, setToken);
                if(errorFlag) { return };
            } else {
                const response = await fetchUncompleteHabit(habitID, token);
                const responseJSON = await response.json();
                const errorFlag = handleResponseError(response, responseJSON, navigate, setToken);
                if(errorFlag) { return };
            };            
        } catch (err) {
            console.error(err);
            navigate("/internal-server-error", {  state: {errorMessage: "Server down, try again later. "} });
            return;
        };
    };

    const getClosestResetTime = async (resetAt, completed) => {
        try {
            let requiredWindow = null;
            let resetAtKeys = Object.keys(resetAt);
            resetAtKeys = resetAtKeys.sort()
            for(let i = 0; i < resetAtKeys.length; i++) {
                let currentWindow = resetAtKeys[i];
                if(UNIXFromMidnight < Number(currentWindow)) {
                    requiredWindow = currentWindow;
                    break;
                };
            };
            if(!requiredWindow) {
                if(completed) {
                    return "You're all done! Check your habits tomorrow.";
                } else {
                    return "No more resets until tomorrow.";
                };
            };
            return minutesToReset(requiredWindow, UNIXFromMidnight);
            } catch (err) {
                console.error(err);
                navigate("/internal-server-error", { state: {  } });
            };
        };

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const handleRefresh = () => {
        setRefreshHabits(!refreshHabits);
    };

    const groupHabitsByCategory = () => {
        const grouped = {};
        const uncategorized = [];

        habits.forEach(habit => {
            if (habit.category_id) {
                if (!grouped[habit.category_id]) {
                    grouped[habit.category_id] = [];
                }
                grouped[habit.category_id].push(habit);
            } else {
                uncategorized.push(habit);
            }
        });

        return { grouped, uncategorized };
    };

    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.category_id === categoryId);
        return cat ? cat.category_name : "Unknown";
    };

    const calculateCategoryStats = (categoryHabits) => {
        const total = categoryHabits.length;
        const completed = categoryHabits.filter(h => h.completed).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, completionRate };
    };

    const renderHabitCard = (habit, globalIndex) => {
        const originalIndex = habits.findIndex(h => h.habit_id === habit.habit_id);
        return (
            <div key={habit.habit_id}>
                <div
                    className="bg-gray-50 dark:bg-slate-900 rounded-2xl shadow p-6 flex flex-col justify-between w-full h-auto transition-colors duration-500 hover:scale-105 hover:shadow-2xl border border-gray-200 dark:border-slate-600"
                >
                    <div>
                        <h3 className="text-xl font-bold mb-2 truncate text-gray-900 dark:text-white">{habit.habit_name}</h3>
                        <p className="text-base mb-2 break-words text-gray-700 dark:text-white">{habit.habit_desc}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">{habit.resetAt}</p>
                        {habit.streak > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                🔥 {habit.streak} day streak
                            </p>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <label className="flex items-center space-x-2 text-sm select-none cursor-pointer">
                            <span className="text-black dark:text-white ">Mark as completed:</span>
                            <span className="relative">
                                <input
                                    type="checkbox"
                                    checked={habit.completed}
                                    onChange={(e) => checkboxHandler(e, habit.habit_id, originalIndex)}
                                    className="peer appearance-none h-5 w-5 rounded-md border border-blue-400 bg-white checked:bg-blue-600 checked:border-blue-600 transition-colors duration-150 ease-in-out outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <svg
                                    className="pointer-events-none absolute left-0 top-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                >
                                    <path d="M6 10l3 3l5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </label>
                    </div>
                    <div>
                        <DeleteHabit setHabits={setHabits} habit={habit} habits={habits} index={originalIndex} setHabitsNumber={setHabitsNumber} habitsNumber={habitsNumber} />
                    </div>
                </div>
            </div>
        );
    };

    const renderCategoryGroup = (categoryId, categoryHabits, isUncategorized = false) => {
        const stats = calculateCategoryStats(categoryHabits);
        const isExpanded = expandedCategories[categoryId] !== false;
        const categoryName = isUncategorized ? "Uncategorized" : getCategoryName(categoryId);
        const icon = isUncategorized ? "📁" : "🏷️";

        return (
            <div key={categoryId || "uncategorized"} className="mb-6">
                <div
                    className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    onClick={() => toggleCategory(categoryId || "uncategorized")}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{isExpanded ? "▼" : "▶"}</span>
                        <span className="text-lg mr-2">{icon}</span>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{categoryName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                            {stats.total} habit{stats.total !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-3 bg-gray-300 dark:bg-gray-500 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${stats.completionRate}%` }}
                                />
                            </div>
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                                {stats.completionRate}%
                            </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">
                            ({stats.completed}/{stats.total} completed)
                        </span>
                    </div>
                </div>
                {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4 px-2">
                        {categoryHabits.map((habit, index) => renderHabitCard(habit, index))}
                    </div>
                )}
            </div>
        );
    };

    if(token) { 
        const { grouped, uncategorized } = groupHabitsByCategory();

        return (   
            <div>
                <NavBar />
                <div className="flex">
                    <CategorySidebar 
                        selectedCategory={selectedCategory}
                        onCategorySelect={handleCategorySelect}
                        refreshTrigger={refreshHabits}
                        onRefresh={handleRefresh}
                    />
                    <section className="bg-white dark:bg-gray-900 min-h-screen flex-1">
                        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-12">
                            <div className="flex justify-center mb-8 gap-5">
                                {habitsNumber < 10 && <AddHabitButton loadHabits={refreshHabits} setLoadHabits={setRefreshHabits} selectedCategory={selectedCategory} />}
                                <button
                                    className="py-2 px-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition"
                                    onClick={() => setRefreshHabits(!refreshHabits)}
                                >
                                    Reload Habits
                                </button>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6 dark:bg-gray-800">
                                {loading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <p className="text-4xl font-bold text-gray-800 dark:text-white">Loading...</p>
                                    </div>
                                ) : habits.length === 0 ? (
                                    <h3 className="text-gray-500 text-xl text-center">
                                        {selectedCategory === "all" 
                                            ? "No habits added yet" 
                                            : selectedCategory === null 
                                                ? "No uncategorized habits"
                                                : "No habits in this category"}
                                    </h3>
                                ) : selectedCategory !== "all" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {habits.map((habit, index) => renderHabitCard(habit, index))}
                                    </div>
                                ) : (
                                    <div>
                                        {Object.keys(grouped).map(categoryId => 
                                            renderCategoryGroup(categoryId, grouped[categoryId])
                                        )}
                                        {uncategorized.length > 0 && 
                                            renderCategoryGroup(null, uncategorized, true)
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
    );
    } else {
        navigate("/login");
    }
};
