import * as core from '@actions/core'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function runSastScan(): Promise<void> {
  try {
    //Retrieve inputs
    const jfrogToken = core.getInput('jfrog-token')
    const contrastAgentVersion = core.getInput('contrast-api-agent-version')
    const fileToBeScanned = core.getInput('file-to-be-scanned')
    const projectName = core.getInput('project-name')
    const userName = core.getInput('contrast-api-user-name')
    const resourceGroup = core.getInput('contrast-api-resource-group')

    const apiUrl = core.getInput('contrast-api-url')
    const apiKey = core.getInput('contrast-api-api-key')
    const serviceKey = core.getInput('contrast-api-service-key')
    const organization = core.getInput('contrast-api-organization')
    const authToken = core.getInput('contrast-auth-token')

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

    console.log(`CONTRAST__API__URL: ${process.env.CONTRAST__API__URL}`)
    console.log(
      `CONTRAST__API__SERVICE_KEY: ${process.env.CONTRAST__API__SERVICE_KEY}`
    )
    console.log(
      `CONTRAST__API__ORGANIZATION: ${process.env.CONTRAST__API__ORGANIZATION}`
    )
    console.log(`CONTRAST__AUTH__TOKEN: ${process.env.CONTRAST__AUTH__TOKEN}`)
    console.log(
      `CONTRAST_RESOURCE_GROUP: ${process.env.CONTRAST_RESOURCE_GROUP}`
    )
    console.log(
      `CONTRAST__API__USER_NAME: ${process.env.CONTRAST__API__USER_NAME}`
    )

    //Run the SAST scan
    core.info('Running SAST scan...')
    const scanCommand = `java -jar scanner.jar ${fileToBeScanned} --project-name test-project-github-action --label Skills.Network@ibm.com -r "IBM Developer Skills Network"`

    const { stdout, stderr } = await execAsync(scanCommand)

    if (stderr) {
      core.setFailed(`SAST scan failed: ${stderr}`)
      return
    }
    core.info(`SAST scan completed successfully:\n${stdout}`)

    // Directly output the scan results to the action log
    core.setOutput('scan-result', stdout)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
