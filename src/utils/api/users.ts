import { fetchDataApi } from "@/utils/callAPI"
import { usersFields } from "@/utils/interface/users.types"


// Login / register ใช้ Google OAuth: redirect ไปที่ getGoogleLoginUrl() (comps/layouts/AuthLayout)


// GET /users/:id - ดึงข้อมูลตาม ID
export const getUserSysById = async (id: number) => {
    const data = await fetchDataApi(`GET`, `institution/${id}`, {});
    return data;
};


// GET /users - ค้นหาผู้ใช้
export const getUsers = async (input: usersFields) => {
    const {
        user_sys_id,
        email,
        role_id,
        role_name,
        flag_valid,
    } = input;

    const data = await fetchDataApi(`GET`, "users", {
        user_sys_id,
        email,
        role_id,
        role_name,
        flag_valid,
    });

    return data;
};

// PUT /users/:id - อัปเดตผู้ใช้
export const updateUser = async (input: usersFields) => {
    const {
        user_sys_id,
        email,
        first_name,
        last_name,
        role_id,
        flag_valid,
    } = input;

    const data = await fetchDataApi(`PUT`, `users/${user_sys_id}`, {
        email,
        first_name,
        last_name,
        role_id,
        flag_valid,
    });

    return data;
};

// DELETE /users/:id - ลบผู้ใช้
export const deleteUser = async (id: number) => {
    const data = await fetchDataApi(`DELETE`, `users/${id}`, {});
    return data;
};