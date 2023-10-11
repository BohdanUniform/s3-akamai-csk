require('dotenv').config();
const { RedirectClient } = require('@uniformdev/redirect');
const fs = require('fs');
const csv = require('csv-parser');

const convertUniformToAkamai = async () => {
  const client = new RedirectClient({
    apiKey: process.env.UNIFORM_API_KEY,
    apiHost: process.env.UNIFORM_BASE_URL,
    projectId: process.env.UNIFORM_PROJECT_ID,
  });

  const ret = [];
  let redirects = (await client.getRedirects({ limit: 50, offset: 0 })).redirects;
  let count = 0;

  while (redirects.length) {
    const redirect = redirects.pop();

    // Prepare redirect data in Akamai
    ret.push({
      source: redirect?.redirect.sourceUrl,
      target: redirect?.redirect.targetUrl,
      status: redirect?.redirect.targetStatusCode,
      queryString: redirect?.redirect.sourceRetainQuerystring,
      description: `Redirect from ${redirect?.redirect.sourceUrl} to ${redirect?.redirect.targetUrl}`,
    });

    if (!redirects.length) {
      count++;
      redirects = (await client.getRedirects({ limit: 50, offset: count * 50 })).redirects;
    }
  }

  // Convert the data to a CSV string
  const csvData = ret.map((row) => {
    return `${row.source},${row.target},${row.status},${row.queryString},"${row.description}"`;
  });

  // Add header row
  const csvContent = ['result.matchURL,redirectURL,result.statusCode,query,ruleName', ...csvData].join('\n');

  if (!fs.existsSync('out')) {
    fs.mkdirSync('out');
  }

  // Write the CSV data to a file
  fs.writeFile('out/akamaiRedirects.csv', csvContent, (e) => {
    if (e) {
      console.error(e);
    }
  });
};

convertUniformToAkamai();


