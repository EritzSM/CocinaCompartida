pipeline {
    agent {
        label 'docker'
    }

    environment {
        DB_USER        = 'postgres'
        DB_PASSWORD    = 'postgres'
        DB_NAME        = 'cocina_compartida_db'
        SONAR_HOST_URL = 'http://host.docker.internal:9000'
        SONAR_TOKEN    = credentials('sonar-token')
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
                    if command -v docker >/dev/null 2>&1; then docker --version; else echo "Docker no disponible"; fi
                    echo "=== Docker Compose ==="
                    if command -v docker-compose >/dev/null 2>&1; then docker-compose --version; else echo "docker-compose no disponible"; fi
                    echo "=== Java ==="
                    if command -v java >/dev/null 2>&1; then java -version; else echo "Java no disponible"; fi
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
                        sh '''
                            if ! command -v sonar-scanner > /dev/null 2>&1; then
                                echo "sonar-scanner no disponible. Instala Sonar Scanner en el agente o configura la herramienta en Jenkins.";
                                exit 1;
                            fi
                            sonar-scanner -Dproject.settings=sonar-project.properties
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Construyendo imagenes Docker'
                sh '''
                    if ! command -v docker >/dev/null 2>&1; then
                        echo "Docker no disponible. Instala Docker en el agente.";
                        exit 1;
                    fi
                    if ! command -v docker-compose >/dev/null 2>&1; then
                        echo "docker-compose no disponible. Instala docker-compose en el agente.";
                        exit 1;
                    fi
                    docker-compose build --no-cache
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Desplegando con docker-compose'
                sh """
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
            echo 'Pipeline exitoso'
        }
        failure {
            echo 'Pipeline fallo - revisar logs'
        }
    }
}