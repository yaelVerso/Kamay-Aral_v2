import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'school-classroom-actions',
  moduleId: 'school',
  title: 'Classroom Actions',
  shortTitle: 'Actions',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'school-read', label: 'Read', videoPath: videoUrl('/videos/school/read.mp4'), acceptedAnswers: ['read'] },
    { id: 'school-write', label: 'Write', videoPath: videoUrl('/videos/school/write.mp4'), acceptedAnswers: ['write'] },
    { id: 'school-study', label: 'Study', videoPath: videoUrl('/videos/school/study.mp4'), acceptedAnswers: ['study'] },
    { id: 'school-listen', label: 'Listen', videoPath: videoUrl('/videos/school/listen.mp4'), acceptedAnswers: ['listen'] },
    { id: 'school-stand', label: 'Stand', videoPath: videoUrl('/videos/school/stand.mp4'), acceptedAnswers: ['stand'] },
    { id: 'school-sit', label: 'Sit', videoPath: videoUrl('/videos/school/sit.mp4'), acceptedAnswers: ['sit'] },
  ],
}

export default submodule
