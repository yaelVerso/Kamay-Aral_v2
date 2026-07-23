import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'questions-pronouns-question-words',
  moduleId: 'questions-pronouns',
  title: 'Question Words',
  shortTitle: 'Questions',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'question-who', label: 'Who', videoPath: videoUrl('/videos/questions-pronouns/who.mp4'),imagePath: imageUrl('/images/5 - questions/5 - who.png'), acceptedAnswers: ['who'] },
    { id: 'question-what', label: 'What', videoPath: videoUrl('/videos/questions-pronouns/what.mp4'),imagePath: imageUrl('/images/5 - questions/5 - what.png'),  acceptedAnswers: ['what'] },
    { id: 'question-where', label: 'Where', videoPath: videoUrl('/videos/questions-pronouns/where.mp4'), imagePath: imageUrl('/images/5 - questions/5 - where.png'), acceptedAnswers: ['where'] },
    { id: 'question-which', label: 'Which', videoPath: videoUrl('/videos/questions-pronouns/which.mp4'), acceptedAnswers: ['which'] },
    { id: 'question-when', label: 'When', videoPath: videoUrl('/videos/questions-pronouns/when.mp4'), acceptedAnswers: ['when'] },
    { id: 'question-why', label: 'Why', videoPath: videoUrl('/videos/questions-pronouns/why.mp4'), acceptedAnswers: ['why'] },
    { id: 'question-how', label: 'How', videoPath: videoUrl('/videos/questions-pronouns/how.mp4'), acceptedAnswers: ['how'] },
  ],
}

export default submodule
