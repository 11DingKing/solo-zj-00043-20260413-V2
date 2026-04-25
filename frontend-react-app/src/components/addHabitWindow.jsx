import React, { useEffect } from "react";
import { useState, useContext } from "react";
import "../index.css"
import { fetchAddHabit, fetchGetCategories } from "../api_fetching/urlParserMainFucntionality";
import { TokenContext } from "../tokenContext";
import { useNavigate } from "react-router";
import { handleResponseError } from "../utils/handleResponse";
import { defineCookiesToken } from "../utils/cookieHandling";

const AddHabitWindow = (props) => {
    const [token, setToken] = defineCookiesToken();

    const navigate = useNavigate();
    const [ resetTimeArray, setResettingTimes ] = useState([]);
    const [ habitName, setHabitName ] = useState("");
    const [ habitsDesc, setHabitDesc ] = useState("");
    const [ categories, setCategories ] = useState([]);
    const [ selectedCategoryId, setSelectedCategoryId ] = useState(null);

    const [ resetHours, setResetHours ] = useState(Number);
    const [ resetMinutes, setResetMinutes ] = useState(Number);

    const [ timeErrorMessage, setTimeErrorMessage ] = useState(null);
    const [ errorMessage, setErrorMessage ] = useState("")

    useEffect(() => {
        loadCategories();
        if (props.selectedCategory && props.selectedCategory !== "all") {
            setSelectedCategoryId(props.selectedCategory);
        }
    }, []);

    const loadCategories = async () => {
        try {
            const response = await fetchGetCategories(token);
            const responseJSON = await response.json();
            const errorFlag = handleResponseError(response, responseJSON, navigate, setToken);
            if (errorFlag) { return; };
            setCategories(responseJSON);
        } catch (err) {
            console.error(err);
        }
    };

    const formatResetTime = (time) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);

        return `${hours.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}:${minutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}`;
    };

    const deleteResetTime = (index) => {
        const updatedResetArray = [...resetTimeArray.slice(0, index), ...resetTimeArray.slice(index + 1)];
        setResettingTimes(updatedResetArray);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const categoryIdToUse = selectedCategoryId === "none" ? null : selectedCategoryId;
            const response = await fetchAddHabit(habitName, habitsDesc, resetTimeArray, token, categoryIdToUse);
            const responseJSON = await response.json();

            if(!response.ok) { handleResponseError(response, responseJSON, navigate, setToken, setErrorMessage); return; };

        } catch (err) {
            console.error(err);
            navigate("/internal-server-error", { state: {errorMessage: "Server down. Please, try again later"}});
            return;
        };

        props.setLoadHabits(!props.loadHabits);
        props.toggle();
    };

    const resetTimeAdding = (e) => {
    e.preventDefault();
    if (
        resetHours >= 0 && resetHours <= 24 &&
        resetMinutes >= 0 && resetMinutes <= 59
    ) {
        

        const resetAtUnix = ((resetHours * 60) * 60) + (resetMinutes * 60);

        if(resetTimeArray.includes(resetAtUnix)) {
            setTimeErrorMessage("You're already added this resetting time!");
            return;
        } 
        setTimeErrorMessage(null);

        const updatedResetArray = [...resetTimeArray];
        updatedResetArray.push(resetAtUnix);

        setResettingTimes(updatedResetArray);
    } else {
        alert("Enter Correct time!");
    };
    };

    return(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fadeIn">
            <div className="flex justify-end m-2">
                <button onClick={() => props.toggle()} className="text-gray-600 dark:text-gray-400">Close</button>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add habit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                {errorMessage && <p className="text-red-700">{errorMessage}</p>}

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Name:
                </label>
                <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Description:
                </label>
                <input
                type="text"
                value={habitsDesc}
                onChange={(e) => setHabitDesc(e.target.value)}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category:
                </label>
                <select
                    value={selectedCategoryId || "none"}
                    onChange={(e) => setSelectedCategoryId(e.target.value === "none" ? null : e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                    <option value="none">Uncategorized</option>
                    {categories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                            {category.category_name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Resetting time, 24 hours:
                </label>
                {timeErrorMessage ? (
                <p className="text-red-500 text-xs mb-1">{timeErrorMessage}</p>
                ) : null}
                <div className="flex gap-2 mb-2">
                <input
                    type="number"
                    value={resetHours}
                    placeholder="Hours (0-24)"
                    onChange={e => {
                    const value = Number(e.target.value);
                    if (value >= 0 && value <= 24) {
                        setResetHours(String(e.target.value));
                    }
                    }}
                    min="0"
                    max="24"
                    required
                    className="w-1/2 rounded border border-gray-300 dark:border-gray-600 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <input
                    type="number"
                    value={resetMinutes}
                    placeholder="Minutes (0-59)"
                    onChange={e => {
                    const value = Number(e.target.value);
                    if (value >= 0 && value <= 59) {
                        setResetMinutes(String(e.target.value));
                    }
                    }}
                    min="0"
                    max="59"
                    className="w-1/2 rounded border border-gray-300 dark:border-gray-600 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <button
                    type="button"
                    onClick={resetTimeAdding}
                    className="ml-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                    Add
                </button>
                </div>
            </div>
            <button
                type="submit"
                className="w-full py-2 px-4 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            >
                Submit
            </button>
            </form>
            <div className="info-block mt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Reset daily at:
            </label>
            <ul className="space-y-2">
                {resetTimeArray.map((time, index) => (
                <li
                    className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                    key={index}
                >
                    <span className="text-gray-700 dark:text-gray-300">{formatResetTime(time)}</span>
                    <button
                    className="ml-3 w-6 h-6 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-full flex items-center justify-center text-red-500 text-lg"
                    aria-label="Close"
                    onClick={() => deleteResetTime(index)}
                    type="button"
                    >
                    &times;
                    </button>
                </li>
                ))}
            </ul>
            </div>
            <button
            onClick={() => props.toggle()}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold focus:outline-none"
            aria-label="Close"
            type="button"
            >
            </button>
        </div>
        </div>
        );
    };

export default AddHabitWindow;
