import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function LearnPage() {
  return (
    <ModuleScaffold
      destinationId="learn"
      phase="V1 — Public language platform"
      lead="Structured courses, vocabulary and listening practice, with Read Aloud that only speaks in voices that have passed language-specific quality review."
      capabilities={[
        {
          heading: 'Curriculum',
          items: [
            'Courses and lessons at beginner, intermediate and advanced levels, built on reviewed content models rather than hard-coded text.',
            'Vocabulary, flashcards, quizzes, listening exercises and sentence construction.',
            'Progress, goals, streaks and resume-learning, tied to the signed-in learner.',
          ],
        },
        {
          heading: 'Read Aloud',
          items: [
            'Play, pause, resume, restart, skip and speed controls across a whole lesson, a paragraph or a single sentence.',
            'Synchronised sentence highlighting only where the provider returns reliable timing metadata; otherwise a simpler playback mode is offered rather than pretending alignment is exact.',
            'Where no approved Yorùbá, Hausa or Igbo voice exists, the limitation is disclosed plainly instead of mispronouncing content.',
          ],
        },
      ]}
      contracts={[
        { method: 'GET', path: '/api/v1/courses', purpose: 'Published courses and levels.' },
        { method: 'GET', path: '/api/v1/lessons/:id', purpose: 'Lesson content, sentences and Read Aloud availability.' },
        { method: 'POST', path: '/api/v1/progress', purpose: 'Record or update learner progress.' },
      ]}
    />
  )
}
