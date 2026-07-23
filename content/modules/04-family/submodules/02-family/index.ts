import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'family-family',
  moduleId: 'family',
  title: 'Family',
  shortTitle: 'Family',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'family-family-word', label: 'Family', labelFil: 'Pamilya', videoPath: videoUrl('/videos/family/family.mp4'), acceptedAnswers: ['family', 'pamilya'] },
    { id: 'family-mother', label: 'Mother', labelFil: 'Nanay', videoPath: videoUrl('/videos/family/mother.mp4'), acceptedAnswers: ['mother', 'nanay'] },
    { id: 'family-father', label: 'Father', labelFil: 'Tatay', videoPath: videoUrl('/videos/family/father.mp4'), acceptedAnswers: ['father', 'tatay'] },
    { id: 'family-older-brother', label: 'Older Brother', labelFil: 'Kuya', videoPath: videoUrl('/videos/family/older-brother.mp4'), acceptedAnswers: ['older brother', 'kuya'] },
    { id: 'family-older-sister', label: 'Older Sister', labelFil: 'Ate', videoPath: videoUrl('/videos/family/older-sister.mp4'), acceptedAnswers: ['older sister', 'ate'] },
    { id: 'family-youngest', label: 'Youngest', labelFil: 'Bunso', videoPath: videoUrl('/videos/family/youngest.mp4'), acceptedAnswers: ['youngest', 'bunso'] },
    { id: 'family-sibling', label: 'Sibling', labelFil: 'Kapatid', videoPath: videoUrl('/videos/family/sibling.mp4'), acceptedAnswers: ['sibling', 'kapatid'] },
  ],
}

export default submodule
