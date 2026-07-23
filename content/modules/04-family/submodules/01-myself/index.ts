import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'family-myself',
  moduleId: 'family',
  title: 'Myself',
  shortTitle: 'Myself',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'myself-name', label: 'Name', videoPath: videoUrl('/videos/family/name.mp4'), acceptedAnswers: ['name'] },
    { id: 'myself-surname', label: 'Surname', videoPath: videoUrl('/videos/family/surname.mp4'), acceptedAnswers: ['surname'] },
    { id: 'myself-age', label: 'Age', videoPath: videoUrl('/videos/family/age.mp4'), acceptedAnswers: ['age'] },
    { id: 'myself-birthday', label: 'Birthday', videoPath: videoUrl('/videos/family/birthday.mp4'), acceptedAnswers: ['birthday'] },
    { id: 'myself-address', label: 'Address', videoPath: videoUrl('/videos/family/address.mp4'), acceptedAnswers: ['address'] },
  ],
}

export default submodule
