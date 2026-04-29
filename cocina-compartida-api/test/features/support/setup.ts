import { configure, Cast, TakeNotes, ArtifactArchiver } from '@serenity-js/core';
import { CallAnApi } from '@serenity-js/rest';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { BeforeAll, AfterAll } from '@cucumber/cucumber';
import { Client } from 'pg';

// Cliente de BD para limpiar datos
const dbClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'cocina_compartida_db',
    password: 'postgres',
    port: 5432,
});

BeforeAll(async () => {
    // Conectar a la base de datos al inicio de todas las pruebas
    await dbClient.connect();
    // Limpiar la base de datos antes de empezar (por si quedó sucia de antes)
    await dbClient.query('TRUNCATE TABLE users, recipes CASCADE;');
});

AfterAll(async () => {
    // Limpiar la base de datos al finalizar
    await dbClient.query('TRUNCATE TABLE users, recipes CASCADE;');
    // Cerrar conexión
    await dbClient.end();
});

// Configuración global de Serenity/JS (Para entorno local Windows)
configure({
    actors: Cast.where(actor => actor.whoCan(
        CallAnApi.at('http://localhost:3000'),
        TakeNotes.usingAnEmptyNotepad()
    )),
    crew: [
        ConsoleReporter.forDarkTerminals(),
        ArtifactArchiver.storingArtifactsAt('./target/site/serenity'),
    ]
});
