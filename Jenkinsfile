pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        DB_USER        = 'postgres'
        DB_PASSWORD    = 'postgres'
        DB_NAME        = 'cocina_compartida_db'
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

        stage('Run Tests') {
            steps {
                echo 'Ejecutando tests'
                sh 'cd cocina-compartida && npm test -- --watch=false --passWithNoTests || true'
                sh 'cd cocina-compartida-api && npm run test:cov'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Ejecutando SonarQube analysis'
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        sh "${scannerHome}/bin/sonar-scanner -Dproject.settings=sonar-project.properties"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Construyendo imagenes Docker'
                sh '''
                    if command -v docker >/dev/null 2>&1; then
                        if docker compose version >/dev/null 2>&1; then
                            docker compose build --no-cache
                        elif command -v docker-compose >/dev/null 2>&1; then
                            docker-compose build --no-cache
                        else
                            echo "No se encontró ni 'docker compose' ni 'docker-compose'."; exit 1
                        fi
                    else
                        echo "No se encontró docker en el agente Jenkins."; exit 1
                    fi
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Desplegando con docker compose'
                sh """
                    cat > .env <<-EOF
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
EOF
                    if command -v docker >/dev/null 2>&1; then
                        if docker compose version >/dev/null 2>&1; then
                            docker compose down || true
                            docker compose up -d
                            docker compose ps
                        elif command -v docker-compose >/dev/null 2>&1; then
                            docker-compose down || true
                            docker-compose up -d
                            docker-compose ps
                        else
                            echo "No se encontró ni 'docker compose' ni 'docker-compose'."; exit 1
                        fi
                    else
                        echo "No se encontró docker en el agente Jenkins."; exit 1
                    fi
                """
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