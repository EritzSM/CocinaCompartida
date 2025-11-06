// seed.mjs

// La URL de tu API (asegúrate que tu backend esté corriendo)
const API_URL = 'http://localhost:3000/users';

// La contraseña en texto plano. Tu API se encargará de hashearla.
const plainPassword = '123456';

// Los 10 usuarios que quieres crear
const usersToCreate = [
  { username: 'admin', email: 'admin@example.com', bio: 'Soy el admin', avatar: 'logos/default.webp', role: 'admin' },
  { username: 'ana', email: 'ana@example.com', bio: 'Hola, soy Ana', avatar: 'logos/default.webp' },
  { username: 'carlos', email: 'carlos@example.com', bio: 'Fanático de la cocina', avatar: 'logos/default.webp' },
  { username: 'laura', email: 'laura@example.com', bio: 'Me gusta programar', avatar: 'logos/default.webp' },
  { username: 'miguel', email: 'miguel@example.com', bio: 'Bio de Miguel', avatar: 'logos/default.webp' },
  { username: 'sofia', email: 'sofia@example.com', bio: 'Amo los gatos', avatar: 'logos/default.webp' },
  { username: 'pablo', email: 'pablo@example.com', bio: 'Bio de Pablo', avatar: 'logos/default.webp' },
  { username: 'elena', email: 'elena@example.com', bio: 'Bio de Elena', avatar: 'logos/default.webp' },
  { username: 'diego', email: 'diego@example.com', bio: 'Bio de Diego', avatar: 'logos/default.webp' },
  { username: 'lucia', email: 'lucia@example.com', bio: 'Bio de Lucía', avatar: 'logos/default.webp' },
];

async function createUsers() {
  console.log('--- Iniciando creación de usuarios ---');

  for (const userData of usersToCreate) {
    // Combinamos los datos del usuario con la contraseña
    const fullUserData = {
      ...userData,
      password: plainPassword,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullUserData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Éxito: Usuario '${result.username}' creado.`);
      } else {
        // Manejamos errores de la API (ej. "Username exists")
        console.warn(`⚠️ Advertencia: No se pudo crear '${userData.username}'. Razón: ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Error fatal creando '${userData.username}': ${error.message}`);
    }
  }
  console.log('--- Proceso de seeding terminado ---');
}

// Ejecutamos la función
createUsers();