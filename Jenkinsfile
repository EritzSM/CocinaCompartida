pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20' // ← Debe coincidir con el nombre en Jenkins > Tools > NodeJS
    }

    environment {
        DB_USER     = 'postgres'
        DB_PASSWORD = 'postgres'
        DB_NAME     = 'cocina_compartida_db'
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_TOKEN    = credentials('sonar-token') // ← Usar credencial segura, no hardcodeada
    }

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        stage('Verify Environment') {
            steps {
                echo 'Verificando entorno...'
                sh '''
                    echo "=== Workspace ==="
                    ls -la
                    echo "=== Node ==="
                    node --version
                    echo "=== npm ==="
                    npm --version
                    echo "=== Docker ==="
                    docker --version
                    docker-compose --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Instalando dependencias del frontend y backend'
                sh 'cd cocina-compartida && npm ci'
                sh 'cd cocina-compartida-api && npm ci'
                // Cada sh[] vuelve al workspace raíz automáticamente ✓
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Ejecutando tests'
                // Frontend
                sh 'cd cocina-compartida && npm test -- --watch=false --passWithNoTests || true'
                // Backend con cobertura
                sh 'cd cocina-compartida-api && npm run test:cov'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Ejecutando SonarQube analysis'
                withSonarQubeEnv('SonarQube') { // ← nombre del paso 2
                    script {
                        def scannerHome = tool 'SonarScanner' // ← nombre del paso 4
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                                -Dproject.settings=sonar-project.properties
                        """
                    }
                }
            }
        }

        // Opcional: esperar resultado del Quality Gate
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Construyendo imágenes Docker'
                sh 'docker-compose build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Desplegando con docker-compose'
                sh """
                    # Usar comillas dobles en Groovy para interpolar variables de entorno
                    cat > .env <<-EOF
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
EOF
                    docker-compose down || true
                    docker-compose up -d
                    docker-compose ps
                """
            }
        }
    }

    post {
        always {
            echo 'Pipeline finalizado'
            archiveArtifacts artifacts: '**/coverage/**', allowEmptyArchive: true
        }
        success {
            echo '✅ Pipeline exitoso'
        }
        failure {
            echo '❌ Pipeline falló — revisar logs'
        }
    }
}