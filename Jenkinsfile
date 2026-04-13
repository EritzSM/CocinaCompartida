pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        DB_USER        = 'postgres'
        DB_PASSWORD    = 'postgres'
        DB_NAME        = 'cocina_compartida_db'
        CHROME_BIN  = '/usr/bin/google-chrome'
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
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Instalando dependencias del frontend y backend'
                sh 'cd cocina-compartida && npm ci'
                sh 'cd cocina-compartida-api && npm ci'
            }
        }

        stage('Frontend Tests') {
            steps {
                echo 'Ejecutando pruebas del frontend'
                dir('cocina-compartida') {
                    sh '''
                        if [ -z "${CHROME_BIN}" ]; then
                            if command -v chromium-browser >/dev/null 2>&1; then
                                export CHROME_BIN="$(command -v chromium-browser)"
                            elif command -v chromium >/dev/null 2>&1; then
                                export CHROME_BIN="$(command -v chromium)"
                            elif command -v google-chrome-stable >/dev/null 2>&1; then
                                export CHROME_BIN="$(command -v google-chrome-stable)"
                            elif command -v google-chrome >/dev/null 2>&1; then
                                export CHROME_BIN="$(command -v google-chrome)"
                            else
                                echo "ERROR: No se encontró un binario de Chrome/Chromium en el agente Jenkins. Instala chromium o google-chrome."
                                exit 1
                            fi
                        fi
                        echo "Usando CHROME_BIN=${CHROME_BIN}"
                        npm test -- --watch=false --browsers=ChromeHeadlessNoSandbox --code-coverage
                    '''
                }
            }
        }

        stage('Backend Tests') {
            steps {
                echo 'Ejecutando pruebas del backend'
                dir('cocina-compartida-api') {
                    sh 'npm run test:cov'
                }
            }
        }

        stage('Frontend SonarQube Analysis') {
            steps {
                echo 'Ejecutando SonarQube analysis del frontend'
                withSonarQubeEnv('SonarQube') {
                    dir('cocina-compartida') {
                        script {
                            def scannerHome = tool 'SonarScanner'
                            sh "${scannerHome}/bin/sonar-scanner \
                                -Dsonar.host.url=\$SONAR_HOST_URL \
                                -Dsonar.login=\$SONAR_AUTH_TOKEN \
                                -Dsonar.projectKey=cocinacompartida_front \
                                -Dsonar.projectName='CocinaCompartida Front' \
                                -Dsonar.sources=src \
                                -Dsonar.tests=src \
                                -Dsonar.test.inclusions=**/*.spec.ts \
                                -Dsonar.javascript.lcov.reportPaths=coverage/cocina-compartida/lcov.info \
                                -Dsonar.sourceEncoding=UTF-8"                        }
                    }
                }
            }
        }

        stage('Frontend Quality Gate') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Backend SonarQube Analysis') {
            steps {
                echo 'Ejecutando SonarQube analysis del backend'
                withSonarQubeEnv('SonarQube') {
                    dir('cocina-compartida-api') {
                        script {
                            def scannerHome = tool 'SonarScanner'
                            sh "${scannerHome}/bin/sonar-scanner \
                                -Dsonar.host.url=\$SONAR_HOST_URL \
                                -Dsonar.login=\$SONAR_AUTH_TOKEN \
                                -Dsonar.projectKey=cocinacompartida_back \
                                -Dsonar.projectName='CocinaCompartida Backend' \
                                -Dsonar.sources=src \
                                -Dsonar.tests=src \
                                -Dsonar.test.inclusions=**/*.spec.ts \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.sourceEncoding=UTF-8"                        }
                    }
                }
            }
        }

        stage('Backend Quality Gate') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Construyendo imagenes Docker'
                sh 'docker compose build --no-cache || docker-compose build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Desplegando con docker compose'
                writeFile file: '.env', text: """DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
"""
                sh '''
                    (docker compose down || docker-compose down) || true
                    (docker compose up -d || docker-compose up -d)
                    (docker compose ps || docker-compose ps)
                '''
            }
        }

    }  // ← THIS was missing — closes stages {}

    post {
        always {
            echo 'Pipeline finalizado'
            archiveArtifacts artifacts: '**/coverage/**', allowEmptyArchive: true
        }
        success {
            echo 'Pipeline exitoso'
        }
        failure {
            echo 'Pipeline fallo - revisar logs'
        }
    }
}