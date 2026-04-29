import { Given, When, Then } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { Send, PostRequest, LastResponse } from '@serenity-js/rest';
import { Ensure, not, includes, equals } from '@serenity-js/assertions';

let invalidPayload: any = {};
let dynamicEmail = '';
let dynamicUsername = '';

// --- GIVEN ---

Given('que no existe ningún usuario con el correo {string}', async (emailTemplate: string) => {
    actorCalled('Visitante');
    // Generamos un correo único usando la fecha actual para evitar colisiones
    dynamicEmail = `user_${Date.now()}@test.com`;
});

Given('no existe ningún usuario con el nombre {string}', async (usernameTemplate: string) => {
    // Generamos un nombre único
    dynamicUsername = `Chef_${Date.now()}`;
});

Given('que ya existe un usuario con el correo {string}', async (email: string) => {
    actorCalled('Visitante');
    dynamicEmail = `existente_${Date.now()}@test.com`;
    // Insertamos el usuario real
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/users').with({
            username: `User_${Date.now()}`,
            email: dynamicEmail,
            password: "Password123!"
        }))
    );
});

Given('que ya existe un usuario con el nombre {string}', async (username: string) => {
    actorCalled('Visitante');
    dynamicUsername = `Existente_${Date.now()}`;
    // Insertamos el usuario real
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/users').with({
            username: dynamicUsername,
            email: `correo_${Date.now()}@test.com`,
            password: "Password123!"
        }))
    );
});

Given('que se intenta registrar un usuario enviando {string} vacío', async (field: string) => {
    actorCalled('Visitante');
    const payload: any = {
        username: `User_${Date.now()}`,
        email: `valido_${Date.now()}@test.com`,
        password: "Password123!"
    };
    payload[field] = ""; 
    invalidPayload = payload;
});


// --- WHEN ---

When('envía una solicitud POST a {string} con los siguientes datos:', async (endpoint: string, dataTable: any) => {
    actorCalled('Visitante');
    const rows = dataTable.hashes();
    const payload: any = {};
    
    for (const row of rows) {
        let value = row.valor.replace(/^"|"$/g, '');
        // Si el valor es el que pasamos en el feature, usamos el dinámico generado
        if (value === "nuevo_chef@test.com") value = dynamicEmail;
        if (value === "NuevoChef") value = dynamicUsername;
        
        payload[row.campo] = value;
    }

    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint).with(payload))
    );
});

When('un nuevo visitante intenta registrarse con ese mismo correo', async () => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/users').with({
            username: `OtroNombre_${Date.now()}`,
            email: dynamicEmail, // Usamos el correo que ya registramos
            password: "Password123!"
        }))
    );
});

When('un nuevo visitante intenta registrarse con ese mismo nombre de usuario', async () => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/users').with({
            username: dynamicUsername, // Usamos el nombre que ya registramos
            email: `otrocorreo_${Date.now()}@test.com`,
            password: "Password123!"
        }))
    );
});

When('un visitante envía una solicitud POST a {string} sin el campo {string}', async (endpoint: string, field: string) => {
    actorCalled('Visitante');
    const payload: any = {
        username: `User_${Date.now()}`,
        email: `valido_${Date.now()}@test.com`,
        password: "Password123!"
    };
    delete payload[field]; 
    
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint).with(payload))
    );
});

When('un visitante intenta registrarse con la contraseña {string}', async (password: string) => {
    actorCalled('Visitante');
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/users').with({
            username: `User_${Date.now()}`,
            email: `valido_${Date.now()}@test.com`,
            password: password
        }))
    );
});

When('envía la solicitud POST a {string}', async (endpoint: string) => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint).with(invalidPayload))
    );
});


// --- THEN ---

Then('el cuerpo de la respuesta NO debe contener el campo {string}', async (field: string) => {
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(Object.keys(body).includes(field), equals(false))
    );
});

Then('el mensaje de error debe indicar que el correo ya está en uso', async () => {
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(body.message, includes("Email ya en uso"))
    );
});

Then('el mensaje de error debe indicar que el nombre de usuario ya está en uso', async () => {
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(body.message, includes("Username ya en uso"))
    );
});

Then('el mensaje de error debe indicar que la contraseña no cumple los requisitos de seguridad', async () => {
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    // El class-validator normalmente devuelve un array en message
    const errorString = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(errorString.toLowerCase(), includes("password"))
    );
});
