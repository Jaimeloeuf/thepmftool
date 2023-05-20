import z from 'zod';

// @todo refactor this
// Duplicate of internal Zod validators to expose the types as standalone types.

export const LongText = z.object({
  type: z.literal('long-text'),
  ques: z.string().nonempty({ message: 'Question cannot be empty' }),
  optional: z.boolean(),
  charLimit: z.number().positive().max(3000),
});
export type LongTextType = z.infer<typeof LongText>;

export const Option = z.object({
  type: z.literal('option'),
  ques: z.string().nonempty({ message: 'Question cannot be empty' }),
  optional: z.boolean(),
  options: z
    .array(z.string())
    .min(1, { message: 'Must have at least 1 option' }),
});
export type OptionType = z.infer<typeof Option>;

/**
 * @todo add custom specific error messages for all the parsers like `title`
 */
export const SurveySchemaParserV1 = z
  .object({
    /**
     * This is a fixed literal as a custom Zod parser will be defined
     * for every specific schema version.
     */
    schemaVersion: z.literal('1'),

    /**
     * @todo
     * ID might by generated by hashing this whole document so that we can check
     * if contents has been changed easily use hashing.
     * A alternative way to prevent changing contents is to just prevent update
     * Queries at the application level instead of implementing integrity checks.
     */
    id: z.string().nonempty({ message: 'ID cannot be empty string' }),

    /**
     * Optionally link back to the last version of the survey.
     *
     * Previous version will not be deleted even if they are no longer used because
     * the past survey response answer depends on the past survey versions.
     */
    idOfPreviousVersion: z
      .string()
      .nonempty({ message: 'Previous version ID cannot be empty string' })
      .optional(),

    // @todo
    // Possibly have a template ID, since most surveys will be the same like the
    // "how disappointed survey" where the only difference is the product name.
    // Reason why we might need this is because the same code to do processing /
    // analytics is the same right? And it does not make much sense to have a
    // custom way of doing analytics for every survey.
    // OR perhaps, template is just like a default schema then users clone and
    // edit from there? Or is it variable based custom input templates?

    /**
     * Time when Survey is created at in ISO DateTime string.
     * Use `new Date().toISOString()`
     */
    createdAt: z.string().datetime({
      precision: 3,
      message:
        'createdAt must be ISO DateTime with 3 digit sub-second precision',
    }),

    /**
     * The Survey creator's UserID
     */
    createdBy: z
      .string()
      .nonempty({ message: 'createdBy cannot be empty string' }),

    /**
     * The Survey's product team ID, i.e. which product team does this survey belong to?
     * This is needed because user might get deleted/deactivated, therefore it is safer
     * to link the survey to a Team rather than a singular UserID.
     */
    ownedBy: z
      .string()
      .nonempty({ message: 'owner ID cannot be empty string' }),

    /**
     * Survey Title
     */
    title: z.string().nonempty({ message: 'Survey title cannot be empty' }),

    /**
     * Optional Survey Subtitle
     */
    subtitle: z
      .string()
      .nonempty({ message: 'Survey subtitle cannot be empty' })
      .optional(),

    /**
     * Survey questions.
     *
     * This is an array of Survey Question objects, where each object
     * describes the question and its properties.
     */
    ques: z
      .array(
        // All Survey Question objects have the string literal `type` discriminant
        z.discriminatedUnion('type', [
          // For short answers, will be rendered by UI to be a single line input
          z.object({
            type: z.literal('short-text'),
            ques: z.string().nonempty({ message: 'Question cannot be empty' }),
            optional: z.boolean(),
            charLimit: z.number().positive().max(300),
          }),

          // For longer text answers, will be rendered by UI to be a text box
          z.object({
            type: z.literal('long-text'),
            ques: z.string().nonempty({ message: 'Question cannot be empty' }),
            optional: z.boolean(),
            charLimit: z.number().positive().max(3000),
          }),
          // LongText,

          // Option question type is like a radio button where you can only select 1 out of N number of options
          // You cannot have a single option only, at least 2. Use checkbox ques instead if you need checkbox behavior!
          z.object({
            type: z.literal('option'),
            ques: z.string().nonempty({ message: 'Question cannot be empty' }),
            optional: z.boolean(),
            options: z
              .array(z.string())
              .min(1, { message: 'Must have at least 1 option' }),
          }),
          // Option,

          // A single checkbox to allow survey responders to toggle its options
          z.object({
            type: z.literal('checkbox'),
            ques: z.string().nonempty({ message: 'Question cannot be empty' }),
            default: z.boolean({
              invalid_type_error: 'Use boolean for checkbox default',
            }),
          }),

          // Other question types
          // DateTime input (must be able to convert the user's local time to UTC for storage)

          // Picture/video upload button and drag+drop box
          // z.object({
          //   type: z.literal('img-upload'),
          //   ques: z.string().nonempty({ message: 'Question cannot be empty' }),
          //   optional: z.boolean(),

          //   /** Should multiple files be accepted */
          //   multipleFiles: z.boolean(),
          //   maxFileNumberLimit: z.number().positive().max(10).optional(),

          //   /** File Size limit in bytes per image, defaults to the maximum limit of 10MB per file */
          //   fileSizeLimit: z
          //     .number()
          //     .positive()
          //     .max(1e7)
          //     .default(1e7)
          //     .optional(),
          // }),
        ]),
      )
      .min(1, { message: 'Must have at least 1 question' }),
  })
  // Error on unknown keys instead of stripping them out during parsing
  .strict();

/**
 * `Survey` type built using Zod parser for now.
 *
 * If there are multiple survey schema versions,
 * this will be a union type of all of them.
 */
export type Survey = z.infer<typeof SurveySchemaParserV1>;

/**
 * Use this function to valdiate a survey schema.
 * Do this validation before saving the survey schema into data source
 */
export function validateSurvey(survey: Survey) {
  // If there are multiple survey schema versions, switch to use specific parser based on version key
  const validationResult = SurveySchemaParserV1.safeParse(survey);

  if (!validationResult.success) {
    console.log(
      'Failed validation',
      validationResult.error.errors.map((error) => error.message),
    );

    return false;
  }

  return true;
}
