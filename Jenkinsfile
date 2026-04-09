pipeline {
    agent any

    environment {
        SONAR_HOST_URL = 'http://your-sonarqube-host:9000'
        SONAR_LOGIN = credentials('sonarqube-token')
        DB_USER = credentials('db-user')
        DB_PASSWORD = credentials('db-password')
        DB_NAME = 'cocina_compartida_db'
    }

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('Install Dependencies') {
            steps {
                echo "========== Instalando dependencias =========="
                sh '''
                    cd cocina-compartida && npm ci && cd ..
                    cd cocina-compartida-api && npm ci && cd ..
                '''
            }
        }

        stage('Tests + Coverage') {
            steps {
                echo "========== Ejecutando tests =========="
                sh '''
                    cd cocina-compartida && npm run test -- --watch=false --code-coverage --browsers=Chrome || true
                    cd cocina-compartida-api && npm run test:cov || true
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo "========== Análisis SonarQube =========="
                sh '''
                    cd cocina-compartida && sonar-scanner \
                      -Dsonar.projectKey=cocina-compartida-frontend \
                      -Dsonar.sources=src \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_LOGIN} && cd ..
                    
                    cd cocina-compartida-api && sonar-scanner \
                      -Dsonar.projectKey=cocina-compartida-backend \
                      -Dsonar.sources=src \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_LOGIN} && cd ..
                '''
            }
        }

        stage('Quality Gate') {
            steps {
                echo "========== Verificando Quality Gate =========="
                sh '''
                    for project in cocina-compartida-frontend cocina-compartida-backend; do
                        timeout 300 bash -c "until curl -s -u ${SONAR_LOGIN}: \
                          \"${SONAR_HOST_URL}/api/qualitygates/project_status?projectKey=${project}\" | \
                          grep -q \"OK\"; do sleep 10; done" || exit 1
                    done
                    echo "✓ Quality Gate pasado"
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo "========== Desplegando aplicación =========="
                sh '''
                    cat > .env << EOF
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
EOF
                    docker-compose -f docker-compose.yml down || true
                    docker-compose -f docker-compose.yml up -d
                    sleep 15
                    docker-compose -f docker-compose.yml ps
                '''
            }
        }
    }

    post {
        always {
            script {
                echo "✓ Pipeline finalizado"
                try {
                    publishHTML([reportDir: 'cocina-compartida/coverage', reportFiles: 'index.html', reportName: 'Frontend Coverage'])
                } catch (Exception e) {
                    echo "Reporte Frontend no disponible"
                }
                try {
                    publishHTML([reportDir: 'cocina-compartida-api/coverage', reportFiles: 'index.html', reportName: 'Backend Coverage'])
                } catch (Exception e) {
                    echo "Reporte Backend no disponible"
                }
            }
        }
        failure {
            node(''){
                script {
                    sh 'docker-compose -f docker-compose.yml down || true'
                    echo "✗ Pipeline fallido"
                }
            }
        }
    }
}