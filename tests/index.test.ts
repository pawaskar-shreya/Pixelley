import { describe, expect, it, test } from "vitest";
import { faker } from "@faker-js/faker";
import axios from "axios";

const BACKEND_URL = "http://localhost:3000"

describe("Authentication", () => {
    test("If user is able to Sign Up only once", async () => {
        const username = faker.internet.username;
        const password = faker.internet.password;

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type : "admin"
        });
        expect(response.status).toBe("200");

        // Fails if the same username is used twice at Sign Up
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type : "admin"
        });
        expect(response.status).toBe("400");
    })

    test("If the user has sent empty fields", async () => {
        const username = faker.internet.username; 
        const password = faker.internet.password;

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
        const username = faker.internet.username;
        const password = faker.internet.password;

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
        const username = faker.internet.username; 
        const password = faker.internet.password;

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            type: "user"
        })

        const wrongPassword = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password: "awsfim"
        })
        expect(wrongPassword.status).toBe(400);

        const wrongUsername = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "awefwa3r4rmwcoie",
            password
        })
        expect(wrongUsername.status).toBe(403);
    })

    // can add more tests like password too big/small, use more special characters
})