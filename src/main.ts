import * as core from '@actions/core'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function runSastScan(): Promise<void> {
  try {
    //Retrieve inputs
    const jfrogToken = core.getInput('jfrog-token')
    // const contrastAgentVersion = core.getInput('contrast-api-agent-version')
    const fileToBeScanned = core.getInput('file-to-be-scanned')
    const githubRepository = process.env.GITHUB_REPOSITORY // e.g., "owner/repo"
    const projectName = `${githubRepository}-scan` // e.g., "owner/repo-scan"
    const userName = core.getInput('contrast-api-user-name')
    const resourceGroup = core.getInput('contrast-api-resource-group')

    const apiUrl = core.getInput('contrast-api-url')
    const apiKey = core.getInput('contrast-api-api-key')
    const serviceKey = core.getInput('contrast-api-service-key')
    const organization = core.getInput('contrast-api-organization')
    const authToken = core.getInput('contrast-api-auth-token')

    //Set environment variables
    process.env['CONTRAST__API__URL'] = apiUrl
    process.env['CONTRAST__API__API_KEY'] = apiKey
    process.env['CONTRAST__API__SERVICE_KEY'] = serviceKey
    process.env['CONTRAST__API__ORGANIZATION'] = organization
    process.env['CONTRAST__AUTH__TOKEN'] = authToken
    process.env['CONTRAST__API__USER_NAME'] = userName
    process.env['CONTRAST_RESOURCE_GROUP'] = resourceGroup

    //Download the scanner from JFrog Artifactory
    core.info('Downloading SAST scanner...')
    await execAsync(
      `wget -O scanner.jar --header="X-JFrog-Art-Api: ${jfrogToken}" https://na.artifactory.swg-devops.com/artifactory/css-whitesource-team-java-contrast-agent-maven-local/sast-local-scan-runner-1.0.9.jar`
    )

    //Log the successful download and expected location of the scanner
    core.info('SAST scanner downloaded successfully. Location: ./scanner.jar')

    //Run the SAST scan
    core.info('Running SAST scan...')
    const scanCommand = `java -jar scanner.jar ${fileToBeScanned} --project-name ${projectName} --label ${userName} -r "IBM Developer Skills Network"`

    const { stdout, stderr } = await execAsync(scanCommand)

    if (stderr) {
      core.setFailed(`SAST scan failed: ${stderr}`)
      return
    }
    core.info(`SAST scan completed successfully:\n${stdout}`)

    // Directly output the scan results to the action log for now
    core.setOutput('scan-result', stdout)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
