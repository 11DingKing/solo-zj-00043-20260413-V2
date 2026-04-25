import { cookieExpiresSeconds } from "../consts";
import {
    addHabitURL,
    getHabitsURL,
    habitCompletionURL,
    deleteHabitURL,
    getHabitCompletionsURL,
    getUserProfileURL,
    uncompleteHabitURL,
    getAllCompletionsURL,
    addCategoryURL,
    getCategoriesURL,
    updateCategoryURL,
    deleteCategoryURL,
    getHabitsByCategoryURL,
} from "./urls";
import { handleResponseError } from "../utils/handleResponse";

export const fetchGetUserProfile = async (token) => {
    const response = await fetch(getUserProfileURL, {
        method: "GET",
        headers: {
            "token": "Bearer " + token
        }
    });
    return response;
};

// export const fetchGetHabitCompeltions = async (token, habitID) => {
//     const response = await fetch(getHabitCompletionsURL, {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json",
//             "token": "Bearer " + token,
//         }, body: JSON.stringify({
//             "habit_id": habitID,
//         }),
//     });
//     return response;
// };

export const fetchGetAllCompletions = async (token) => {
    const response = await fetch(getAllCompletionsURL, {
        method: "GET",
        headers: {
            "token": "Bearer " + token,
        },
    });
    return response;
};

export const fetchGetHabits = async (token) => {
    const response = await fetch(getHabitsURL, {
        method: "GET",
        headers: {
            "token": "Bearer " + token
        },
    });
    return response;
};

export const fetchAddHabit = async (habitName, habitDesc, resetAt, token, categoryId = null) => {
    const body = {
        "habit_name": habitName,
        "habit_desc": habitDesc,
        "reset_at": resetAt
    };
    if (categoryId) {
        body["category_id"] = categoryId;
    }
    const response = await fetch(addHabitURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "Bearer " + token
        },
        body: JSON.stringify(body)
    });
    return response
};

export const fetchHabitCompletion = async (habitID, token) => {
    const response = await fetch(habitCompletionURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "Bearer " + token
        }, body: JSON.stringify({
            "habit_id": habitID,
        })
    });
    return response
};

export const fetchUncompleteHabit = async (habitID, token) => {
    const response = await fetch(uncompleteHabitURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "Bearer " + token
        }, body: JSON.stringify({
            "habit_id": habitID,
        })
    });
    return response
};

export const fetchDeleteHabit = async (habitID, token) => {
    const response = await fetch(deleteHabitURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "Bearer " + token
        }, body: JSON.stringify({
            "habit_id": habitID,
        })
    });
    return response
};

export const fetchGetHabitCompletion = async (habitID, token) => {
    const response = await fetch(getHabitCompletionsURL, {
        method: "GET",
        headers: {
            "token": "Bearer " + token
        }, body: JSON.stringify({
            "habit_id": habitID,
        })
    });
    return response;
};

export const fetchAddCategory = async (categoryName, token) => {
    const response = await fetch(addCategoryURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "Bearer " + token
        },
        body: JSON.stringify({
            "category_name": categoryName
        })
    });
    return response;
};

export const fetchGetCategories = async (token) => {
    const response = await fetch(getCategoriesURL, {
        method: "GET",
        headers: {
            "token": "Bearer " + token
        }
    });
    return response;
};

export const fetchUpdateCategory = async (categoryId, categoryName, token) => {
    const response = await fetch(updateCategoryURL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "token": "Bearer " + token
        },
        body: JSON.stringify({
            "category_id": categoryId,
            "category_name": categoryName
        })
    });
    return response;
};

export const fetchDeleteCategory = async (categoryId, token) => {
    const response = await fetch(deleteCategoryURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "Bearer " + token
        },
        body: JSON.stringify({
            "category_id": categoryId
        })
    });
    return response;
};

export const fetchGetHabitsByCategory = async (categoryId, token) => {
    let url = getHabitsByCategoryURL;
    if (categoryId !== null) {
        url += `?category_id=${encodeURIComponent(categoryId)}`;
    }
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "token": "Bearer " + token
        }
    });
    return response;
};