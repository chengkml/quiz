-- Add prompt template for vocabulary definition generation
INSERT INTO prompt_templates (id, name, content, description, create_date, create_user)
SELECT REPLACE(UUID(), '-', ''),
       'vocabularyDefinitionGenerate',
    'You are a bilingual English-Chinese tutor. Generate a Markdown definition for the word "{{word}}".\n\nRequirements:\n- Output directly in Markdown format (no JSON wrapper).\n- Use the following structure:\n  ### 单词释义\n  ---\n  - **单词**: {{word}}\n  - **释义**: (provide English and Chinese meanings)\n  - **例句**: \n    > Provide a practical example sentence.\n  - **对比**: \n    | 单词 | 区别 |\n    | :--- | :--- |\n    | Similar Word | Explain the difference |\n\nCurrent time: {{currentDateTime}}.',
       'Generate Markdown definition for vocabulary cards.',
       NOW(),
       'system'
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_templates WHERE name = 'vocabularyDefinitionGenerate'
);
