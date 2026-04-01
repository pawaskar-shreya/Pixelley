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
            type: "admin"
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
            type: "user"
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
            type: "admin"
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
            type: "user"
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
                spaceId, 
                elementId: getArenaBeforeDelete.data.elements[0].id
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