import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'family-people',
  moduleId: 'family',
  title: 'People',
  shortTitle: 'People',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'people-teacher', label: 'Teacher', videoPath: videoUrl('/videos/family/teacher.mp4'), acceptedAnswers: ['teacher'] },
    { id: 'people-classmate', label: 'Classmate', videoPath: videoUrl('/videos/family/classmate.mp4'), acceptedAnswers: ['classmate'] },
    { id: 'people-friend', label: 'Friend', videoPath: videoUrl('/videos/family/friend.mp4'), acceptedAnswers: ['friend'] },
    { id: 'people-child', label: 'Child', videoPath: videoUrl('/videos/family/child.mp4'), acceptedAnswers: ['child'] },
    { id: 'people-boy', label: 'Boy', videoPath: videoUrl('/videos/family/boy.mp4'), acceptedAnswers: ['boy'] },
    { id: 'people-girl', label: 'Girl', videoPath: videoUrl('/videos/family/girl.mp4'), acceptedAnswers: ['girl'] },
  ],
}

export default submodule
