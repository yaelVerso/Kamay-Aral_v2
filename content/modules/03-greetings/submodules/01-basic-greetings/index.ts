import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'greetings-basic-greetings',
  moduleId: 'greetings',
  title: 'Basic Greetings',
  shortTitle: 'Greetings',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'greeting-hi', label: 'Hi', videoPath: videoUrl('/videos/greetings/hi.mp4'),imagePath: imageUrl('/images/3 - greetings/3 - hi.png'), acceptedAnswers: ['hi'] },
    { id: 'greeting-hello', label: 'Hello', videoPath: videoUrl('/videos/greetings/hello.mp4'),imagePath: imageUrl('/images/3 - greetings/3 - hello.png'), acceptedAnswers: ['hello'] },
    { id: 'greeting-good-morning', label: 'Good Morning', videoPath: videoUrl('/videos/greetings/good-morning.mp4'),imagePath: imageUrl('/images/3 - greetings/3 - good morning.png'), acceptedAnswers: ['good morning'] },
    { id: 'greeting-good-afternoon', label: 'Good Afternoon', videoPath: videoUrl('/videos/greetings/good-afternoon.mp4'), acceptedAnswers: ['good afternoon'] },
    { id: 'greeting-good-evening', label: 'Good Evening', videoPath: videoUrl('/videos/greetings/good-evening.mp4'), acceptedAnswers: ['good evening'] },
    { id: 'greeting-goodnight', label: 'Goodnight', videoPath: videoUrl('/videos/greetings/goodnight.mp4'), acceptedAnswers: ['goodnight', 'good night'] },
  ],
}

export default submodule
