import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

/*
This format applies to every sub-module file under content/modules
(each module's submodules/<name>/index.ts), not just this one — copy this
comment block there too if it's missing.

Format:
{ id: 'letter-n', label: 'N', videoPath: videoUrl('/videos/alphabet/n.mp4'), imagePath: imageUrl('/images/alphabet/n.png'), acceptedAnswers: ['n'] },

- id: unique across the whole app, e.g. 'letter-n', 'numbers-15', 'greeting-hello'
- label: what's shown on screen, e.g. 'N', '15', 'Hello'
- labelFil (optional): Filipino translation, only if different from label
- videoPath: videoUrl('/videos/<folder>/<file>.mp4') — the sign video
- imagePath (optional): imageUrl('/images/<folder>/<file>.png') — leave this line
  out entirely for items with no picture; the app automatically shows an
  enlarged label instead, no broken image or placeholder
- acceptedAnswers: correct spellings for the Spelling activity, lowercase,
  include common variants, e.g. ['first', '1st']
*/

const submodule: SubModule = {
  id: 'alphabet-a-to-g',
  moduleId: 'alphabet',
  title: 'Letters A to G',
  shortTitle: 'A–G',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    {
      id: 'letter-a',
      label: 'A',
      videoPath: videoUrl('/videos/alphabet/a.mp4'),
      acceptedAnswers: ['a'],
    },
    {
      id: 'letter-b',
      label: 'B',
      videoPath: videoUrl('/videos/alphabet/b.mp4'),
      acceptedAnswers: ['b'],
    },
    {
      id: 'letter-c',
      label: 'C',
      videoPath: videoUrl('/videos/alphabet/c.mp4'),
      acceptedAnswers: ['c'],
    },
    {
      id: 'letter-d',
      label: 'D',
      videoPath: videoUrl('/videos/alphabet/d.mp4'),
      acceptedAnswers: ['d'],
    },
    {
      id: 'letter-e',
      label: 'E',
      videoPath: videoUrl('/videos/alphabet/e.mp4'),
      acceptedAnswers: ['e'],
    },
    {
      id: 'letter-f',
      label: 'F',
      videoPath: videoUrl('/videos/alphabet/f.mp4'),
      acceptedAnswers: ['f'],
    },
    {
      id: 'letter-g',
      label: 'G',
      videoPath: videoUrl('/videos/alphabet/g.mp4'),
      acceptedAnswers: ['g'],
    },
  ],
}

export default submodule
