pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    environment {
        AWS_REGION          = 'ap-south-1'
        AWS_DEFAULT_REGION  = 'ap-south-1'
        AWS_CREDENTIALS_ID  = 'aws-ecr-credentials'
        ECR_REGISTRY        = credentials('AWS_ECR_REGISTRY_URL') // e.g. 838885265032.dkr.ecr.ap-south-1.amazonaws.com
        IMAGE_TAG           = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['dev', 'prod'], description: 'Target environment for build and deployment')
        booleanParam(name: 'RUN_SECURITY_SCAN', defaultValue: true, description: 'Run Trivy security scan')
    }

    stages {
        stage('Quality Gates & Tests') {
            parallel {
                stage('Backend CI') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "=== Running Python Tests & Linting ==="
                                python3 -m venv .venv
                                . .venv/bin/activate
                                pip install --upgrade pip
                                pip install -r requirements-dev.txt
                                ruff check app/ tests/
                                pytest tests/ -v --cov=app --cov-report=xml:coverage.xml
                            '''
                        }
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, testResults: 'backend/**/pytest*.xml'
                        }
                    }
                }

                stage('Frontend CI') {
                    steps {
                        dir('frontend') {
                            sh '''
                                echo "=== Running Frontend Build & Typecheck ==="
                                npm ci
                                npm run build
                            '''
                        }
                    }
                }
            }
        }

        stage('Security Vulnerability Scan') {
            when {
                expression { return params.RUN_SECURITY_SCAN }
            }
            steps {
                sh '''
                    echo "=== Running Trivy Security Vulnerability Scan ==="
                    if command -v trivy >/dev/null 2>&1; then
                        trivy fs --severity HIGH,CRITICAL --exit-code 0 .
                    else
                        echo "Trivy not pre-installed on worker; skipping binary scan."
                    fi
                '''
            }
        }

        stage('AWS ECR Authentication') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: env.AWS_CREDENTIALS_ID
                ]]) {
                    sh '''
                        echo "=== Logging into Amazon ECR ==="
                        aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    '''
                }
            }
        }

        stage('Docker Build & Tag') {
            steps {
                sh """
                    echo "=== Building Backend Docker Image for Environment: ${params.DEPLOY_ENV} ==="
                    BACKEND_REPO="scalekart-backend-${params.DEPLOY_ENV}"

                    # Backend container
                    docker build \\
                        -t \${ECR_REGISTRY}/\${BACKEND_REPO}:\${IMAGE_TAG} \\
                        -t \${ECR_REGISTRY}/\${BACKEND_REPO}:latest \\
                        ./backend
                """
            }
        }

        stage('Push to AWS ECR') {
            steps {
                sh """
                    echo "=== Pushing Backend Image to AWS ECR for: ${params.DEPLOY_ENV} ==="
                    BACKEND_REPO="scalekart-backend-${params.DEPLOY_ENV}"

                    docker push \${ECR_REGISTRY}/\${BACKEND_REPO}:\${IMAGE_TAG}
                    docker push \${ECR_REGISTRY}/\${BACKEND_REPO}:latest
                """
            }
        }

        stage('Deploy Frontend to CDN (S3 + CloudFront)') {
            steps {
                sh """
                    echo "=== Deploying Frontend to S3 + CloudFront CDN (${params.DEPLOY_ENV}) ==="
                    cd frontend
                    npm ci
                    npm run build
                    cd ..

                    BUCKET=\$(cd terraform/environments/${params.DEPLOY_ENV} && terraform output -raw frontend_s3_bucket 2>/dev/null || echo "")
                    DIST_ID=\$(cd terraform/environments/${params.DEPLOY_ENV} && terraform output -raw frontend_cloudfront_distribution_id 2>/dev/null || echo "")

                    if [ -n "\$BUCKET" ] && [ -n "\$DIST_ID" ]; then
                        echo "Syncing build artifacts to S3 bucket: \${BUCKET}..."
                        aws s3 sync frontend/dist/ s3://\${BUCKET} --delete
                        echo "Invalidating CloudFront CDN cache for distribution: \${DIST_ID}..."
                        aws cloudfront create-invalidation --distribution-id \${DIST_ID} --paths "/*"
                        echo "Frontend CDN deployment complete!"
                    else
                        echo "CloudFront infrastructure not provisioned yet; skipping S3 sync."
                    fi
                """
            }
        }

        stage('GitOps Promotion (Helm & ArgoCD)') {
            steps {
                sh """
                    echo "=== Updating Helm values for GitOps Reconciliation (${params.DEPLOY_ENV}) ==="
                    HELM_VALUES_PATH="helm/scalekart/values-${params.DEPLOY_ENV}.yaml"

                    # Update tag in environment-specific values file
                    sed -i.bak "s|tag:.*# Automatically updated by Jenkins|tag: \\"${IMAGE_TAG}\\" # Automatically updated by Jenkins|g" \${HELM_VALUES_PATH}
                    rm -f \${HELM_VALUES_PATH}.bak

                    # Commit to Git repository to trigger ArgoCD auto-sync
                    git config user.name "Jenkins GitOps Bot"
                    git config user.email "jenkins-bot@simianx.io"
                    git add \${HELM_VALUES_PATH}
                    
                    if git diff-index --quiet HEAD --; then
                        echo "No changes in Helm values to commit."
                    else
                        git commit -m "chore(gitops): promote release \${IMAGE_TAG} to ${params.DEPLOY_ENV} [skip ci]"
                        git push origin HEAD:\${GIT_BRANCH}
                        echo "Promoted \${IMAGE_TAG} to \${HELM_VALUES_PATH}. ArgoCD will now reconcile \${params.DEPLOY_ENV}."
                    fi
                """
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! SimianX ${IMAGE_TAG} built and deployed to ${params.DEPLOY_ENV} via GitOps."
        }
        failure {
            echo "Pipeline failed! Please check logs for test or deployment failures."
        }
        always {
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    notFailBuild: true)
        }
    }
}
