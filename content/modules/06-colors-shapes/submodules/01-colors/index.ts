import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'colors-shapes-colors',
  moduleId: 'colors-shapes',
  title: 'Colors',
  shortTitle: 'Colors',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'color-red', label: 'Red', videoPath: videoUrl('/videos/colors-shapes/red.mp4'),imagePath: imageUrl('/images/6 - colors/6 - red.png'),  acceptedAnswers: ['red'] },
    { id: 'color-blue', label: 'Blue', videoPath: videoUrl('/videos/colors-shapes/blue.mp4'), imagePath: imageUrl('/images/6 - colors/6 - blue.png'), acceptedAnswers: ['blue'] },
    { id: 'color-yellow', label: 'Yellow', videoPath: videoUrl('/videos/colors-shapes/yellow.mp4'), imagePath: imageUrl('/images/6 - colors/6 - yellow.png'), acceptedAnswers: ['yellow'] },
    { id: 'color-green', label: 'Green', videoPath: videoUrl('/videos/colors-shapes/green.mp4'), acceptedAnswers: ['green'] },
    { id: 'color-orange', label: 'Orange', videoPath: videoUrl('/videos/colors-shapes/orange.mp4'), acceptedAnswers: ['orange'] },
    { id: 'color-purple', label: 'Purple', videoPath: videoUrl('/videos/colors-shapes/purple.mp4'), acceptedAnswers: ['purple'] },
    { id: 'color-pink', label: 'Pink', videoPath: videoUrl('/videos/colors-shapes/pink.mp4'), acceptedAnswers: ['pink'] },
    { id: 'color-white', label: 'White', videoPath: videoUrl('/videos/colors-shapes/white.mp4'), acceptedAnswers: ['white'] },
    { id: 'color-black', label: 'Black', videoPath: videoUrl('/videos/colors-shapes/black.mp4'), acceptedAnswers: ['black'] },
    { id: 'color-brown', label: 'Brown', videoPath: videoUrl('/videos/colors-shapes/brown.mp4'), acceptedAnswers: ['brown'] },
  ],
}

export default submodule
