import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'colors-shapes-shapes',
  moduleId: 'colors-shapes',
  title: 'Shapes',
  shortTitle: 'Shapes',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'shape-circle', label: 'Circle', videoPath: videoUrl('/videos/colors-shapes/circle.mp4'), acceptedAnswers: ['circle'] },
    { id: 'shape-oval', label: 'Oval', videoPath: videoUrl('/videos/colors-shapes/oval.mp4'), acceptedAnswers: ['oval'] },
    { id: 'shape-square', label: 'Square', videoPath: videoUrl('/videos/colors-shapes/square.mp4'), acceptedAnswers: ['square'] },
    { id: 'shape-rectangle', label: 'Rectangle', videoPath: videoUrl('/videos/colors-shapes/rectangle.mp4'), acceptedAnswers: ['rectangle'] },
    { id: 'shape-triangle', label: 'Triangle', videoPath: videoUrl('/videos/colors-shapes/triangle.mp4'), acceptedAnswers: ['triangle'] },
  ],
}

export default submodule
