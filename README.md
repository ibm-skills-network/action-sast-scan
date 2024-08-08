# action-sast-scan

This GitHub Action is designed for scanning Skills Network repositories using Contrast SAST. It automates the process and uploads the scan results to the Contrast portal.

## Updating the action


1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

1. Replace the contents of `src/` with your action code
3. Add tests to `__tests__/` for your source code if nessary
4. Format, test, and build the action

   ```bash
   npm run all
   ```

   > This step is important! It will run [`ncc`](https://github.com/vercel/ncc)
   > to build the final JavaScript action code with all dependencies included.
   > If you do not run this step, your action will not work correctly when it is
   > used in a workflow. This step also includes the `--license` option for
   > `ncc`, which will create a license file for all of the production node
   > modules used in your project.
   >
5. Commit your changes

   ```bash
   git add .
   git commit -m "Fix: Update action code"
   ```
6. Push them to your repository

   ```bash
   git push -u origin <branch_name>
   ```
7. Get approval from a fulltimer and merge the PR into the `main` branch

See more info regarding updating  on the [TypeScript action template repo](https://github.com/actions/typescript-action/blob/main/README.md)
