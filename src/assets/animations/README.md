# Chef Character Animations

This directory contains Lottie animations for the cooking character feature (Issue #57).

## Current Animations

The current animations are **simple placeholders** for development and testing purposes. They are minimal Lottie JSON files that demonstrate the animation system working.

## Replacing with Better Animations

To get high-quality chef character animations, visit [LottieFiles](https://lottiefiles.com/free-animations/chef) and download animations that match these specifications:

### Required Animations (MVP)

| Animation | File Name | Purpose | Target Size | Characteristics |
|-----------|-----------|---------|-------------|----------------|
| Idle | `chef-idle.json` | Default looping animation | ~50KB | Gentle swaying, blinking, breathing |
| Talking/Speaking | `chef-talking.json` | During voice narration | ~100KB | Mouth movement, head bobbing |
| Celebration | `chef-celebrate.json` | Step completion success | ~120KB | Jumping, waving, excited gesture |
| Timer Alert | `chef-alert.json` | Timer completion | ~60KB | Energetic shaking, attention-grabbing |

### Design Criteria

When selecting animations from LottieFiles, look for:

- ✅ **Simple, friendly character design**
- ✅ **Food/cooking themed** (chef hat, apron, utensils)
- ✅ **Culturally neutral appearance**
- ✅ **File size < 150KB each** (optimize if needed)
- ✅ **Loop-friendly** for idle and talking animations
- ✅ **Clear start/end states** for one-shot animations (celebrate, alert)

### Recommended LottieFiles Collections

1. **[Chef Animations](https://lottiefiles.com/free-animations/chef)** - Hundreds of free chef character animations
2. **[Cooking Essentials](https://lottiefiles.com/free-animations/cooking)** - Cooking-themed animations
3. **[Diverse People Cooking Food Pack](https://lottiefiles.com/marketplace/diverse-people-cooking-food)** - Character diversity options

### How to Download from LottieFiles

1. Visit [LottieFiles.com](https://lottiefiles.com)
2. Search for "chef", "cooking", or "cook"
3. Filter by "Free" animations
4. Preview animations to find suitable ones
5. Click "Download" → Select "Lottie JSON"
6. Rename downloaded file to match our naming convention
7. Replace the placeholder file in this directory

### Example Good Animations

- [Cooking Chef by Andrew B. Chisholm](https://lottiefiles.com/104313-cooking-chef) - Full chef character cooking
- Search "chef idle" for looping idle animations
- Search "chef celebrating" or "chef happy" for celebration animations
- Search "chef talking" or "chef speaking" for speaking animations

### Optimization

If downloaded animations are too large (>150KB):

1. Use [LottieFiles Editor](https://app.lottiefiles.com/) to edit and optimize
2. Remove unnecessary layers or effects
3. Reduce frame rate if needed (30 FPS is sufficient)
4. Use online tools like [Lottie Optimizer](https://lottiefiles.com/tools/lottie-optimizer)

### Animation Specifications

**Lottie JSON Format:**
- Version: 5.x compatible
- Frame rate: 30 FPS (recommended)
- Dimensions: 200x200px (or similar square aspect ratio)
- Duration: 2-4 seconds (looping animations), 3-5 seconds (one-shot animations)

**Test Animations:**
After replacing placeholders, test in the app:
```bash
npm start
# Navigate to a recipe → Start cooking mode
# Verify character appears and animations trigger correctly
```

## Future Enhancements

Additional animations for Phase 3+ (not in MVP):

- `chef-stirring.json` - Stirring motion for stirring steps
- `chef-chopping.json` - Chopping motion for cutting steps
- `chef-waiting.json` - Waiting/idle animation for rest steps

## Technical Notes

- All animations are loaded via `require()` in `src/components/cooking/CookingCharacter.tsx`
- Animations are preloaded on CookingModeScreen mount for smooth transitions
- Lottie renderer handles animation playback via `lottie-react-native` library
- File paths are typed in `src/types/character.ts`

---

**Last Updated:** 2025-01-24
**Related Issue:** [#57 - Animated Cooking Character](https://github.com/dianadragoi35/InstaDishMobile/issues/57)
