import { beforeAll, describe, expect, expectTypeOf, it, test } from "vitest";
import { faker } from "@faker-js/faker";
import axios from "axios";

const BACKEND_URL = "http://localhost:3000"

describe("Authentication", () => {
    test("If user is able to Sign Up only once", async () => {
        const username = faker.internet.username();
        const password = faker.internet.password();

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type : "admin"
        });
        expect(response.status).toBe(200);

        // Fails if the same username is used twice at Sign Up
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type : "admin"
        });
        expect(response.status).toBe(400);
    })

    test("If the user has sent empty fields for signup", async () => {
        const username = faker.internet.username(); 
        const password = faker.internet.password();

        const onlyUsernameResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password: "", 
            type: "user" 
        })
        expect(onlyUsernameResponse.status).toBe(400);

        const onlyPasswordResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: "",
            password, 
            type: "user" 
        })
        expect(onlyPasswordResponse.status).toBe(400);

        const bothEmpty = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: "",
            password: "", 
            type: "user" 
        })
        expect(bothEmpty.status).toBe(400);
    })

    test("Signin should succeed if the username and password are correct", async () => {
        const username = faker.internet.username();
        const password = faker.internet.password();

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type: "admin" 
        })

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password
        })
        expect(response.status).toBe(200);
        expect(response.data.token).toBeDefined;
    })

    test("Signin should fail if the username and password are incorrect", async () => {
        const username = faker.internet.username(); 
        const password = faker.internet.password();

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type: "user"
        })

        const wrongPassword = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password: "awsfim"
        })
        expect(wrongPassword.status).toBe(403);

        const wrongUsername = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "awefwa3r4rmwcoie",
            password
        })
        expect(wrongUsername.status).toBe(403);
    })

    // can add more tests like password too big/small, use more special characters
})

describe("User metadata endpoints", () => {
    let token = "";
    let avatarId = "";

    beforeAll(async () => {
        // signup and signin the user once for all the tests
        const username = faker.internet.username();
        const password = faker.internet.password();

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type: "admin"
        })

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password
        })

        token = response.data.token;

        // create avatar once and get its id to use in the right avatarId use case
        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            name: "Timmy"
        }, {
            headers : {
                Authorization: `Bearer ${token}`
            }
        })

        avatarId = avatarResponse.data.avatarId;
    })

    test("If the avatarId is wrong, user can't update their metadata", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "12435983"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        expect(response.status).toBe(400);
    })

    test("If the avatarId is right, user can update their metadata", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200);
    })
})

describe("User avatar information", async () => {
    let token = "";
    let avatarId = "";
    let userId = ""

    beforeAll(async () => {
        const username = faker.internet.username();
        const password = faker.internet.password();

        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password,
            type: "admin"
        })

        userId = signupResponse.data.userId;

        const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password
        })

        token = signinResponse.data.token;

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        avatarId = avatarResponse.data.avatarId;
    })

    test("If user can get all available avatars", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
        
        expect(response.status).toBe(200);
        expect(response.data.avatars.length).not.toBe(0);
    })

    test("Get avatar metadata of users in the same arena", async () => {
        // The user is trying to get their own avatar
        const response = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`);

        expect(response.status).toBe(200);
        expect(response.data.avatars[0].userId).toBe(userId);
    })
})