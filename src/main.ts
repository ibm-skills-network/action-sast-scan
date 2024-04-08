import * as core from '@actions/core'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import archiver from 'archiver'

const execAsync = promisify(exec)

//zip files
async function zipFiles(outputFilename: string, files: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFilename)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    archive.on('error', function (err: Error) {
      reject(err)
    })

    output.on('close', function () {
      core.info(`${outputFilename} has been created`)
      resolve()
    })

    archive.pipe(output)

    files.forEach(file => {
      archive.file(file, { name: file.split('/')?.pop() || '' })
    })

    archive.finalize()
  })
}

export async function runSastScan(): Promise<void> {
  try {
    //Retrieve inputs
    const jfrogToken = core.getInput('jfrog-token')
    const fileToBeScanned = core.getInput('file-to-be-scanned')
    const projectName = core.getInput('project-name')
    const userName = core.getInput('contrast-api-user-name')
    const resourceGroup = core.getInput('contrast-api-resource-group')

    const apiUrl = core.getInput('contrast-api-url')
    const apiKey = core.getInput('contrast-api-api-key')
    const serviceKey = core.getInput('contrast-api-service-key')
    const organization = core.getInput('contrast-api-organization')
    const authToken = core.getInput('contrast-api-auth-token')

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

    core.info('SAST scanner downloaded successfully. Location: ./scanner.jar')

    //Run the SAST scan
    core.info('Running SAST scan...')
    const scanCommand = `java -jar scanner.jar ${fileToBeScanned} --project-name ${projectName} --label ${userName} -r "${resourceGroup}"`

    const { stdout, stderr } = await execAsync(scanCommand)

    if (stderr) {
      core.setFailed(`SAST scan failed: ${stderr}`)
      return
    }
    core.info(`SAST scan completed successfully:\n${stdout}`)

    //list all the files created by scanner 
    const files = fs.readdirSync('.');
    core.info('Files created:');
    files.forEach(file => core.info(file));

    // Try saving scan results to a csv
    const resultsFilePath = './sast-results.csv'
    fs.writeFileSync(resultsFilePath, 'Your parsed results here')

    //zip result
    await zipFiles('sast-report.zip', [resultsFilePath])
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
