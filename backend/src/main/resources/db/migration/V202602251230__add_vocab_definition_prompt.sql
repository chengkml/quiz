-- Add prompt template for vocabulary definition generation
INSERT INTO prompt_templates (id, name, content, description, create_date, create_user)
SELECT REPLACE(UUID(), '-', ''),
       'vocabularyDefinitionGenerate',
    'You are a bilingual English-Chinese tutor. Generate a Markdown definition for the word "{{word}}".\n\nRequirements:\n- Output ONLY valid JSON.\n- JSON schema: {"word":"...","mdDefinition":"..."}.\n- mdDefinition must be Markdown with the following structure:\n  ### 单词释义\n  ---\n  - **单词**: {{word}}\n  - **释义**: \n  - **例句**: \n    > Example sentence here.\n  - **对比**: \n    | 单词 | 区别 |\n    | :--- | :--- |\n    | Word A | ... |\n\nCurrent time: {{currentDateTime}}.',
       'Generate Markdown definition for vocabulary cards.',
       NOW(),
       'system'
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_templates WHERE name = 'vocabularyDefinitionGenerate'
);
