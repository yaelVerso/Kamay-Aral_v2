import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'food-food',
  moduleId: 'food',
  title: 'Food',
  shortTitle: 'Food',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'food-rice', label: 'Rice', videoPath: videoUrl('/videos/food/rice.mp4'), acceptedAnswers: ['rice'] },
    { id: 'food-bread', label: 'Bread', videoPath: videoUrl('/videos/food/bread.mp4'), acceptedAnswers: ['bread'] },
    { id: 'food-egg', label: 'Egg', videoPath: videoUrl('/videos/food/egg.mp4'), acceptedAnswers: ['egg'] },
    { id: 'food-fish', label: 'Fish', videoPath: videoUrl('/videos/food/fish.mp4'), acceptedAnswers: ['fish'] },
    { id: 'food-chicken', label: 'Chicken', videoPath: videoUrl('/videos/food/chicken.mp4'), acceptedAnswers: ['chicken'] },
    { id: 'food-vegetables', label: 'Vegetables', videoPath: videoUrl('/videos/food/vegetables.mp4'), acceptedAnswers: ['vegetables', 'vegetable'] },
    { id: 'food-fruit', label: 'Fruit', videoPath: videoUrl('/videos/food/fruit.mp4'), acceptedAnswers: ['fruit'] },
    { id: 'food-banana', label: 'Banana', videoPath: videoUrl('/videos/food/banana.mp4'), acceptedAnswers: ['banana'] },
    { id: 'food-apple', label: 'Apple', videoPath: videoUrl('/videos/food/apple.mp4'), acceptedAnswers: ['apple'] },
  ],
}

export default submodule
