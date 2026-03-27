-- Remove statistics center menu entries so the frontend no longer exposes statistics-center.

DELETE FROM menu
WHERE menu_id IN (
    'statistics_knowledge_mastery',
    'statistics_vocabulary_proficiency',
    'statistics',
    'statistics_center'
)
   OR menu_name IN (
    'statistics_knowledge_mastery',
    'statistics_vocabulary_proficiency',
    'statistics',
    'statistics_center'
)
   OR url IN (
    'statistics-center',
    'statistics-center/question-bank',
    'statistics-center/vocabulary-proficiency',
    'statistics-center/knowledge-mastery',
    'statistics'
);
