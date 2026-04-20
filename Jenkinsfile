pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        DB_USER     = 'postgres'
        DB_PASSWORD = 'postgres'
        DB_NAME     = 'cocina_compartida_db'
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
                sh 'find . -name "report-task.txt" -delete || true'
                sh 'cd cocina-compartida && npm ci'
                sh 'cd cocina-compartida-api && npm ci'
            }
        }

        stage('Frontend Tests') {
            steps {
                echo 'Frontend tests skipped - no Chrome available in CI'
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
                dir('cocina-compartida') {
                    sh 'rm -rf .scannerwork'
                    withSonarQubeEnv('SonarQube') {
                        script {
                            def scannerHome = tool 'SonarScanner'
                            sh "${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=cocinacompartida_front \
                                -Dsonar.projectName='CocinaCompartida Front' \
                                -Dsonar.sources=src \
                                -Dsonar.tests=src \
                                -Dsonar.test.inclusions=**/*.spec.ts \
                                -Dsonar.sourceEncoding=UTF-8"
                        }
                    }
                    timeout(time: 3, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: false
                    }
                }
            }
        }

        stage('Backend SonarQube Analysis') {
            steps {
                echo 'Ejecutando SonarQube analysis del backend'
                dir('cocina-compartida-api') {
                    sh 'rm -rf .scannerwork'
                    withSonarQubeEnv('SonarQube') {
                        script {
                            def scannerHome = tool 'SonarScanner'
                            sh "${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=cocinacompartida_back \
                                -Dsonar.projectName='CocinaCompartida Backend' \
                                -Dsonar.sources=src \
                                -Dsonar.tests=src \
                                -Dsonar.test.inclusions=**/*.spec.ts \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.sourceEncoding=UTF-8"
                        }
                    }
                    timeout(time: 3, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }
        stage('Build Docker Images') {
            when {
                expression {
                    return sh(script: 'command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1', returnStatus: true) == 0
                }
            }
            steps {
                echo 'Construyendo imagenes Docker'
                sh '''
                    if command -v docker compose >/dev/null 2>&1; then
                      docker compose build --no-cache
                    elif command -v docker-compose >/dev/null 2>&1; then
                      docker-compose build --no-cache
                    else
                      echo 'docker compose / docker-compose no disponible'
                      exit 1
                    fi
                '''
            }
        }

        stage('Deploy') {
            when {
                expression {
                    return sh(script: 'command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1', returnStatus: true) == 0
                }
            }
            steps {
                echo 'Desplegando con docker compose'
                writeFile file: '.env', text: """DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
"""
                sh '''
                    if command -v docker compose >/dev/null 2>&1; then
                      docker compose down || true
                      docker compose up -d
                      docker compose ps
                    elif command -v docker-compose >/dev/null 2>&1; then
                      docker-compose down || true
                      docker-compose up -d
                      docker-compose ps
                    else
                      echo 'docker compose / docker-compose no disponible'
                      exit 1
                    fi
                '''
            }
        }

    }

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