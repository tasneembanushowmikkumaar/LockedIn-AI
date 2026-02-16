# **App Name**: LockedIn AI

## Core Features:

- Live Countdown Timer: Display a live countdown timer that updates every second, persisting across tabs/sessions via localStorage. Includes a red pulsing glow when <24h remaining and a randomly activated 'Punishment Mode' visual cue.
- Dynamic Task System: Rotate 5 tasks based on current tier, punishment mode, and time of day. Tasks include JOI/CEI, CBT, and denial examples. Task states: Pending -> Active -> Completed -> Failed.  Submit Proof button marks complete (local state).  Failed tasks extend the timer.
- Real-Time AI Chat: Simulate real-time chat with AI responding in <1s based on tier logic. Tier 3 Hardcore AI responses include harsh commands, degradation, and rare approval. The tool remembers chat context: recent failures, streaks, timer status. Messages persist with smooth scrolling.
- Dynamic Calendar: Display a live month view calendar with the current day highlighted.  The release date moves based on compliance (+/- hours).  Red punishment days appear on task failure.  Green streak days when 100% compliant.  Adjustment log updates live with changes.

## Style Guidelines:

- Primary color: Deep, muted purple (#58415F) evoking a sense of control and seriousness.
- Background color: Dark, desaturated grayish purple (#28222B).
- Accent color: Dusty rose (#A36B8F) to provide subtle highlights without disrupting the serious tone.
- Font: 'Inter', a grotesque-style sans-serif font, suitable for both headlines and body text.
- Use serious, tactile icons that reinforce the chastity control device theme. Each task should have a unique corresponding visual.
- Mobile-first responsive bento grid layout (1->3 columns) for clear content hierarchy. Neumorphic shadows for a tactile UX.
- Subtle, serious animations for timer updates and task completion to provide feedback without distracting from the content.