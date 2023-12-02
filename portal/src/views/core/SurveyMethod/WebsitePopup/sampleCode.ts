export const generateMainFile = (
  formFileName: string,
  surveyLink: string,
  surveyTimeInterval: number
) => `import { openForm } from "./${formFileName}";

// You can load the form link dynamically as env var
// if you want to use different form links for production/staging/dev.
openForm('${surveyLink}', ${surveyTimeInterval});

// Run \`openForm\` function at the start of your app before initialising
// anything since this might redirect user away to complete the survey first.

// Initialise your app here...`;

export const generateFormFile = (
  localStorageKey: string,
  alertUser: boolean,
  alertMessage: string
) => `/// THIS IS AUTO-GENERATED BY https://muwno.com

/**
 * Open feedback form if user have not responded to the survey in the last
 * \`feedbackIntervalTime\` milliseconds.
 */
export function openForm(
  /**
   * Link to the feedback form. You can get this from the https://muwno.com
   * dashboard.
   */
  formLink: string,

  /**
   * Time in milliseconds for how often you want to survey your customers. E.g.
   * \`6.048e8\` milliseconds for 1 week.
   */
  feedbackIntervalTime: number
) {
  // Create cut-off date as ISO DateTime String using \`feedbackIntervalTime\`.
  const cutOffDate = new Date(Date.now() - feedbackIntervalTime).toISOString();

  // Load the locally stored last survey response time.
  // You can choose to load this from an API too.
  const muwnoFormResponseTime = localStorage.getItem('${localStorageKey}');

  // If user has never responded to the survey before.
  // OR if the last response is older than the cut off date.
  if (muwnoFormResponseTime === null || muwnoFormResponseTime < cutOffDate) {
    // Save current time as last response first to ensure that the form will not
    // open on every single call to this function if form opening fails.
    localStorage.setItem('${localStorageKey}', new Date().toISOString());

    ${alertUser ? `alert('${alertMessage}')\n` : ""}
    // Simple redirect.
    window.location.href = formLink;

    // Alternatively you can use these other ways of opening the form if you do
    // not want to do a redirect with \`location.href\`.
    // window.open(formLink, "_blank"); // Open in new tab
    // window.open(formLink, "_self"); // Open in current self as open target.
  }
}`;
