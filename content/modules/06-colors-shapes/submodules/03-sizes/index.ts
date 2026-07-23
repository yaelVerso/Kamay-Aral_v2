import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'colors-shapes-sizes',
  moduleId: 'colors-shapes',
  title: 'Sizes',
  shortTitle: 'Sizes',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'size-big', label: 'Big', videoPath: videoUrl('/videos/colors-shapes/big.mp4'), acceptedAnswers: ['big'] },
    { id: 'size-small', label: 'Small', videoPath: videoUrl('/videos/colors-shapes/small.mp4'), acceptedAnswers: ['small'] },
    { id: 'size-long', label: 'Long', videoPath: videoUrl('/videos/colors-shapes/long.mp4'), acceptedAnswers: ['long'] },
    { id: 'size-short', label: 'Short', videoPath: videoUrl('/videos/colors-shapes/short.mp4'), acceptedAnswers: ['short'] },
    { id: 'size-thick', label: 'Thick', videoPath: videoUrl('/videos/colors-shapes/thick.mp4'), acceptedAnswers: ['thick'] },
    { id: 'size-thin', label: 'Thin', videoPath: videoUrl('/videos/colors-shapes/thin.mp4'), acceptedAnswers: ['thin'] },
  ],
}

export default submodule
