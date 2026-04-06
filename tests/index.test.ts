import { beforeAll, describe, expect, expectTypeOf, it, test } from "vitest";
import { faker } from "@faker-js/faker";
import axios2 from "axios";
import type { AxiosResponse, AxiosError } from "axios";

const axios = {
    post: async (...args: Parameters<typeof axios2.post>) : Promise<AxiosResponse> => {
        try {
            const res = await axios2.post(...args);
            return res;
        } catch(e) {
            const err = e as AxiosError;
            return err.response as AxiosResponse;
        }
    }, 
    put: async (...args: Parameters<typeof axios2.post>) : Promise<AxiosResponse> => {
        try {
            const res = await axios2.put(...args);
            return res;
        } catch(e) {
            const err = e as AxiosError;
            return err.response as AxiosResponse;
        }
    }, 
    get: async (...args: Parameters<typeof axios2.post>) : Promise<AxiosResponse> => {
        try {
            const res = await axios2.get(...args);
            return res;
        } catch(e) {
            const err = e as AxiosError;
            return err.response as AxiosResponse;
        }
    }, 
    delete: async (...args: Parameters<typeof axios2.post>) : Promise<AxiosResponse> => {
        try {
            const res = await axios2.delete(...args);
            return res;
        } catch(e) {
            const err = e as AxiosError;
            return err.response as AxiosResponse;
        }
    }
}

const BACKEND_URL = "http://localhost:3000"
const WS_URL = "ws://localhost:3001"

describe("Authentication", () => {
    test("If user is able to Sign Up only once", async () => {
        const username = faker.internet.username();
        const password = faker.internet.password();

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            role : "admin"
        });
        expect(response.status).toBe(200);

        // Fails if the same username is used twice at Sign Up
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            role : "admin"
        });
        expect(response.status).toBe(400);
    })

    test("If the user has sent empty fields for signup", async () => {
        const username = faker.internet.username(); 
        const password = faker.internet.password();

        const onlyUsernameResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password: "", 
            role: "user" 
        })
        expect(onlyUsernameResponse.status).toBe(400);

        const onlyPasswordResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: "",
            password, 
            role: "user" 
        })
        expect(onlyPasswordResponse.status).toBe(400);

        const bothEmpty = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: "",
            password: "", 
            role: "user" 
        })
        expect(bothEmpty.status).toBe(400);
    })

    test("Signin should succeed if the username and password are correct", async () => {
        const username = faker.internet.username();
        const password = faker.internet.password();

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            role: "admin" 
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
            role: "user"
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
            role: "admin"
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

describe("User avatar endpoints", () => {
    let token = "";
    let avatarId = "";
    let userId = ""

    beforeAll(async () => {
        const username = faker.internet.username();
        const password = faker.internet.password();

        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password,
            role: "admin"
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

describe("Space endpoints", () => {
    let adminId = "";
    let adminToken = "";
    let mapId = "";
    let element1Id = "";
    let element2Id = "";
    let userId = "";
    let userToken = "";

    beforeAll(async () => {
        let AdminUsername = faker.internet.username();
        let AdminPassword = faker.internet.password();

        // signup and signin as Admin
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            AdminUsername, 
            AdminPassword, 
            role: "admin"
        })

        adminId = signupResponse.data.userId;

        const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            AdminUsername, 
            AdminPassword
        })

        adminToken = signinResponse.data.token;

        // create elemets for the below space
        const element1IdResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true        // weather or not the user can sit on top of this element (is it considered as a collission or not)
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        element1Id = element1IdResponse.data.id;

        const element2IdResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true  
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        element2Id = element2IdResponse.data.id;

        // create a map for below tests
        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "100 person interview room",
            defaultElements: [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                    elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        mapId = mapResponse.data.mapId;

        // sign up and signin as User
        let username = faker.internet.username();
        let password = faker.internet.password();

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            role: "user"
        })

        userId = userSignupResponse.data.userId;

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password
        })

        userToken = userSigninResponse.data.token;
    })

    test("User is able to create a space with a mapId", async () => {
        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test",
            dimensions: "100x200",
            mapId
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        expect(createSpaceResponse.status).toBe(200);
        expect(createSpaceResponse.data.spaceId).toBeDefined();
    })

    test("User is able to create a space without a mapId if dimensions are sent, so an empty space", async () => {
        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test", 
            dimensions: "200x200"
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(createSpaceResponse.data.status).toBe(200);
        expect(createSpaceResponse.data.spaceId).toBeDefined();
    })

    test("User is not able to create a space if both mapId and dimensions are not sent", async () => {
        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test"
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(createSpaceResponse.status).toBe(400);
        expect(createSpaceResponse.data.spaceId).not.toBeDefined();
    })

    test("User is able to delete a space if spaceId is valid", async () => {
        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test", 
            mapId
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        const spaceId = createSpaceResponse.data.spaceId;

        const deleteSpaceResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/:${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        expect(spaceId).not.toBeDefined();
        expect(deleteSpaceResponse.status).toBe(200);
    })

    test("User is not able to delete a space if spaceId is invalid", async () => {
        // Ramdon spaceId, so the space does not exist
        const deleteSpaceResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/2394082`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        expect(deleteSpaceResponse.status).toBe(400);
    })

    test("User should not be able to delete someone else's space", async () => {
        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test", 
            mapId
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        const spaceId = createSpaceResponse.data.spaceId;

        const deleteSpaceResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/:${spaceId}`, {
            headers: {
                Authorization: `Bearer ${adminToken}`           // tries to delete a user space with adminToken
            }
        })
        
        expect(spaceId).toBeDefined();
        expect(deleteSpaceResponse.status).toBe(403);
    })

    test("User should get an empty array if he has not created any spaces", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                Authorization: `Bearer ${adminToken}`           // Haven't created spaces for admin
            }
        })

        expect(response.data.spaces.length).toBe(0);
    })

    test("User should be able to get all of their spaces", async () => {
        const createSpace1Response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test",
            dimensions: "100x200",
            mapId
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        const space1Id = createSpace1Response.data.spaceId;

        const allSpacesResponse = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(allSpacesResponse.data.spaces.length).toBe(1);

        const space1Obj = allSpacesResponse.data.spaces.find(
            (x: { id: number }) => x.id === space1Id
        );

        expect(space1Obj).toBeDefined();
    })

    test("User should not be able to get other user's spaces", async () => {
        const createSpace1Response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test",
            dimensions: "100x200",
            mapId
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        const space1Id = createSpace1Response.data.spaceId;

        const allSpacesResponse = await axios.post(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                Authorization: `Bearer ${adminToken}`            // Admin should not be able to get user's spaces
            }
        })

        expect(allSpacesResponse.status).toBe(403);
    })
})

describe("Arena endpoints", () => {
    let adminId = "";
    let adminToken = "";
    let mapId = "";
    let element1Id = "";
    let element2Id = "";
    let userId = "";
    let userToken = "";
    let spaceId = "";

    beforeAll(async () => {
        let AdminUsername = faker.internet.username();
        let AdminPassword = faker.internet.password();

        // signup and signin as Admin
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            AdminUsername, 
            AdminPassword, 
            role: "admin"
        })

        adminId = signupResponse.data.userId;

        const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            AdminUsername, 
            AdminPassword
        })

        adminToken = signinResponse.data.token;

        // sign up and signin as User
        let username = faker.internet.username();
        let password = faker.internet.password();

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            role: "user"
        })

        userId = userSignupResponse.data.userId;

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password
        })

        userToken = userSigninResponse.data.token;

        // create elemets for the below space
        const element1IdResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true        // weather or not the user can sit on top of this element (is it considered as a collission or not)
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        element1Id = element1IdResponse.data.id;

        const element2IdResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true  
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        element2Id = element2IdResponse.data.id;

        // create a map for below tests
        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "100 person interview room",
            defaultElements: [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                    elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        mapId = mapResponse.data.mapId;

        // create a space for below tests
        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test",
            dimensions: "100x200",
            mapId
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        spaceId = createSpaceResponse.data.spaceId;
    })

    test("User should not be able to get a space with an incorrect spaceId", async () => {
        const getArena = await axios.get(`${BACKEND_URL}/api/v1/space/3940823`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(getArena.status).toBe(400);
    })

    test("User should be able to get all the elements and dimensions with a correct spaceId", async () => {
        const getArena = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(getArena.data.dimensions).toBe("100x200");
        expect(getArena.data.elements.length).toBe(2);
    })

    test("User should be able to delete an element in the space they own", async () => {
        const getArenaBeforeDelete = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
            data: {
                userId,
            }, 
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        const getArenaAfterDelete = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(getArenaAfterDelete.data.elements.length).toBe(1);
    })

    test("User should be able to add an element to a space", async () => {
        await axios.post(`${BACKEND_URL}/api/v1/space/element`, {
            spaceId, 
            elementId: element1Id, 
            x: 50, 
            y: 20
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        const getArena = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        expect(getArena.data.elements.length).toBe(3);
    })

    test("User should not be able to add an element if the location for adding is outside dimensions", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space/element`, {
            spaceId, 
            elementId: element1Id, 
            x: 50000, 
            y: 2000
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(404);
    })
})

describe("Admin endpoints", () => {
    let adminId = "";
    let adminToken = "";
    let userId = "";
    let userToken = "";

    beforeAll(async () => {
        let AdminUsername = faker.internet.username();
        let AdminPassword = faker.internet.password();

        // signup and signin as Admin
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            AdminUsername, 
            AdminPassword, 
            role: "admin"
        })

        adminId = signupResponse.data.userId;

        const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            AdminUsername, 
            AdminPassword
        })

        adminToken = signinResponse.data.token;

        // signup and signin as User
        let username = faker.internet.username();
        let password = faker.internet.password();

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            role: "user"
        })

        userId = userSignupResponse.data.userId;

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password
        })

        userToken = userSigninResponse.data.token;
    })

    test("Non-admin user should not be able to access any of the 4 admin endpoints", async () => {
        const createElement = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        const updateElement = await axios.put(`${BACKEND_URL}/api/v1/admin/element/1234`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE"	
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        const createAvatar = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            name: "Timmy"
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        const createMap = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "100 person interview room",
            defaultElements: []
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        expect(createElement.status).toBe(403);
        expect(updateElement.status).toBe(403);
        expect(createAvatar.status).toBe(403);
        expect(createMap.status).toBe(403);
    })

    test("Admin should be able to hit the admin endpoints", async () => {
        const createElement = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })
        const elementId = createElement.data.id;

        const updateElement = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${elementId}`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE"	
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        const createAvatar = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            name: "Timmy"
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })
        
        const createMap = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "100 person interview room",
            defaultElements: []
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        expect(createElement.status).toBe(200);
        expect(updateElement.status).toBe(200);
        expect(createAvatar.status).toBe(200);
        expect(createMap.status).toBe(200);
    })
})

describe("Websocket Tests", () => {
    // create 2 users, create a map, create a space, 

    let adminToken = "";
    let adminId = "";
    let userToken = "";
    let userId = "";
    let mapId = "";
    let spaceId = "";

    let ws1: WebSocket;
    let ws2: WebSocket;

    type WSMessage = {
        type: string, 
        payload?: any, 
        users?: any
    }

    let ws1Messages: WSMessage[] = [];
    let ws2Messages: WSMessage[] = [];
    let adminX;
    let adminY; 
    let userX; 
    let userY;

    // haven't created elements for HTTP server
    async function setupHTTP() {
        let AdminUsername = faker.internet.username();
        let AdminPassword = faker.internet.password();

        // signup and signin as Admin
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            AdminUsername, 
            AdminPassword, 
            role: "admin"
        })
        
        const adminId = signupResponse.data.userId;

        const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            AdminUsername, 
            AdminPassword
        })

        adminToken = signinResponse.data.token;

        // signup and signin as User
        let username = faker.internet.username();
        let password = faker.internet.password();

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username, 
            password, 
            role: "user"
        })

        const userId = userSignupResponse.data.userId;

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username, 
            password
        })

        userToken = userSigninResponse.data.token;

        // create a map 
        const createMap = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "100 person interview room",
            defaultElements: []
        }, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })

        mapId = createMap.data.id;

        // create a space
        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test",
            dimensions: "100x200",
            mapId
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        spaceId = createSpaceResponse.data.spaceId;
    }

    async function setupWS() {
        // This is the correct order,   create a ws client -> attach handlers -> await onopen
        // Attach the handlers before onopen fires, so that no messages are missed

        // ws client for one user
        ws1 = new WebSocket(WS_URL);

        ws1.onmessage = (event) => {
            ws1Messages.push(JSON.parse(event.data));       // event.data would be a string as we can only pass binary data and strings on a wss. So, JSON.parse it
        }

        await new Promise(r => {
            ws1.onopen = r;
        })

        // ws client for another user
        ws2 = new WebSocket(WS_URL);

        ws2.onmessage = (event) => {
            ws2Messages.push(JSON.parse(event.data));
        }

        await new Promise(r => {
            ws2.onopen = r;
        })
    }

    // We are polling using setInterval to see if any msg has arrived from the server
    // If the message is there, we resolve immediately, or else we resolve as soon as we get the message
    // There is a better event driven way to do this
    async function waitForAndPopLatestMessage(messageArray: WSMessage[]) : Promise<WSMessage> {
        return new Promise(resolve => {
            if(messageArray.length > 0) {
                resolve(messageArray.shift()!);             // ! is the non-null operator, telling TS that this is never going to be undefined
            } else {
                let interval = setInterval(() => {
                    if(messageArray.length > 0) {
                        resolve(messageArray.shift()!);
                        clearInterval(interval);
                    }
                }, 100);
            }
        })
    }

    beforeAll(async () => {
        setupHTTP();
        setupWS();
    })

    test("Get back ack for joinng the space", async () => {
        // first user joins
        ws1.send(JSON.stringify({
            type: "join",
            payload: {
                spaceId,
                token: adminToken
            }
        }))

        let message1 = await waitForAndPopLatestMessage(ws1Messages);       // admin getting space-joined ack
        let adminX = message1.payload.spawn.x;
        let adminY = message1.payload.spawn.y;

        // second user joins
        ws2.send(JSON.stringify({
           type: "join",
            payload: {
                spaceId,
                token: userToken
            } 
        }))

        let message2 = await waitForAndPopLatestMessage(ws2Messages);       // user getting space-joined ack
        let userX = message2.payload.spawn.x;
        let userY = message2.payload.spawn.y;

        let message3 = await waitForAndPopLatestMessage(ws1Messages);       // user-join event received by admin when user joins

        expect(message1.type).toBe("space-joined");
        expect(message2.type).toBe("space-joined");

        // We have created the ws clients in such a way that ws1 connects and only then ws2 connects
        expect(message1.users.lengthh).toBe(0);                     // Admin joins first, hence receives 0
        expect(message2.users.lengthh).toBe(1);                     // User joins second, hence receives 1

        expect(message3.type).toBe("user-join");
        expect(message3.payload.userId).toBe(userId);
        expect(message3.payload.x).toBe(userX);
        expect(message3.payload.y).toBe(userY);
    })

    test("User should not be able to move across the boundary of the wall", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: 100000, 
                y: 200000
            }
        }))

        let message1 = await waitForAndPopLatestMessage(ws1Messages);

        expect(message1.type).toBe("movement-rejected");
        expect(message1.payload.x).toBe(adminX);
        expect(message1.payload.y).toBe(adminY);
    })

    test("User should not be able to move more than 1 block at a time", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminX! + 2, 
                y: adminY
            }
        }))

        let message1 = await waitForAndPopLatestMessage(ws1Messages);

        expect(message1.type).toBe("movement-rejected");
        expect(message1.payload.x).toBe(adminX);
        expect(message1.payload.y).toBe(adminY);
    })

    test("Correct movement should be broadcasted to all the other users in the room", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminX! + 1, 
                y: adminY
            }
        }))

        let message2 = await waitForAndPopLatestMessage(ws2Messages);

        // The other user will receive a movement event
        expect(message2.type).toBe("movement");
        expect(message2.payload.x).toBe(adminX! + 1);
        expect(message2.payload.y).toBe(adminY);
        expect(message2.payload.userId).toBe(adminId);
    })

    test("If a user leaves, other user should receive the leave event", async () => {
        ws1.close()         // user1 aka admin left

        let message2 = await waitForAndPopLatestMessage(ws2Messages);

        expect(message2.type).toBe("user-left");
        expect(message2.payload.userId).toBe(adminId);
    })
})