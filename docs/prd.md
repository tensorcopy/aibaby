# Baby Parenting Assistant PRD v1

## 1. Document Information
- Product name: Baby Parenting Assistant (working title)
- Version: PRD v1
- Document date: 2026-03-10
- Product format: Conversational AI parenting app
- Current goal: Define the MVP scope and validate core user value and feasibility

---

## 2. Product Background

Families with babies who have started solids repeat the same tasks every day:
- Record what the baby ate today
- Judge whether nutrition intake is sufficient
- Understand what deserves extra attention at the baby’s current age
- Review diet and growth over the past week or month

Existing solutions usually have several problems:
- Manual logging is expensive in time and effort, with too many forms to fill out
- Photos can be stored, but they do not become structured records
- Parenting reminders are fragmented and are not linked to the baby’s age or recent intake
- Few products handle both high-frequency logging and long-term review well

This product aims to solve those problems in the most natural way:
**Parents only need to send a photo or a short message, and the system automatically handles logging, analysis, reminders, and review.**

---

## 3. Product Goals

### 3.1 MVP Goals
Without increasing the burden on parents, complete the following loop:
1. Quickly log the baby’s daily food intake
2. Automatically generate daily and weekly nutrition analysis
3. Provide stage-specific reminders based on age
4. Complete the primary interaction through chat
5. Let users review the last 7 or 30 days of growth and feeding data in dedicated pages

### 3.2 Non-goals (not included in MVP)
- Medical diagnosis or disease assessment
- Replacing advice from pediatricians or nutritionists
- Complex business areas such as commerce, community, or online consultation
- Professional nutrition calculations accurate to grams or milligrams
- Complex permissions or collaboration systems for multiple babies
- A full maternal and infant platform covering sleep training, bowel movements, vaccines, developmental assessment, and more

---

## 4. Target Users

### 4.1 Core Users
- Parents of babies aged 6 months to 3 years
- Families already in the solids or mixed-feeding stage
- Users who want a clear picture of diet and growth
- Busy parents who cannot tolerate complicated manual logging

### 4.2 Secondary Users
- Grandparents
- Nannies / caregivers
- Other family caregivers

### 4.3 User Characteristics
- Highly dependent on mobile phones
- Prefer taking a photo or saying one sentence instead of filling out forms
- Highly sensitive to questions like "Is the baby eating a balanced diet?" and "What matters most at this stage?"
- Will keep using the product only if input is lightweight and feedback is genuinely valuable

---

## 5. Core User Pain Points

1. **Logging is hard**
   - Recording what the baby ate is not hard once, but keeping it up over time is
   - Taking a photo is easy; entering weights and categories manually is tedious

2. **Analysis is hard**
   - Parents know what the baby ate, but they cannot easily judge the nutritional structure
   - It is especially hard to know whether iron, vegetable variety, and protein coverage are sufficient

3. **Reminders are fragmented**
   - Age-specific development tips, solid-food priorities, and safety reminders are spread across short videos, public accounts, and chat groups
   - There is no unified reminder system tied to both the baby’s age and recent real intake

4. **Review is hard**
   - After a week, parents can no longer clearly remember what the baby ate or which new foods were tried
   - There is no structured timeline when they want to review trends

---

## 6. Core Value Proposition

### 6.1 User Value
- Use chat instead of forms for logging
- Use photos plus AI to reduce logging cost
- Use daily and weekly summaries to provide immediate feedback
- Use age-based reminders to proactively tell parents what to focus on now
- Open directly into an AI conversation instead of a dashboard-first utility flow

### 6.2 One-line Description
**Raise your baby as if you were chatting with an assistant who understands parenting, keeps records, and sends reminders.**

---

## 7. Product Principles

1. **Ultra-simple input**: Whenever possible, a photo or one sentence should be enough to complete a record
2. **Immediate feedback**: A record created today should generate value today
3. **Conservative recommendations**: Offer supportive guidance only, never medical judgment
4. **Reviewable history**: Every record should eventually become part of a structured history
5. **Chat first, pages second**: Use chat for input and pages for review
6. **Conversation is home**: The first screen should feel like talking to an AI parenting assistant

---

## 8. MVP Feature Scope

### 8.1 Module A: Baby Profile

#### Description
Users create and maintain the baby’s basic profile, which supports analysis and reminders.

#### Fields
- Baby nickname
- Date of birth
- Gender (optional)
- Feeding mode (breast milk / formula / mixed / solids started)
- Known allergens or dietary restrictions (optional)
- Routine supplements (such as iron or vitamin D)
- Primary caregiver (optional)

#### User Value
- Automatically calculate age stage
- Support stage-based reminders
- Personalize nutrition guidance

#### Acceptance Criteria
- The user can create one baby profile
- The user can edit birth date, supplements, and allergy information
- After creation, the system correctly shows the current age stage

---

### 8.2 Module B: Conversational Feeding Logs

#### Description
Users send photos, text, or both in chat, and the system automatically generates feeding records.

#### Supported Inputs
- Image only
- Text only
- Image plus text
- Voice-to-text (optional for MVP, not included by default)

#### Example Inputs
- "For breakfast, she had three slices of zucchini egg pancake and one-sixth of an avocado"
- Upload a photo of a meal plate
- "He ate two pieces of beef and half a small bowl of noodles"

#### System Behavior
1. Recognize food names
2. Estimate portion size when possible
3. Automatically classify the meal type (breakfast / lunch / dinner / snack / milk)
4. Generate a structured record
5. Ask follow-up questions when information is incomplete
6. Accept a single conversational send action that can include both images and a short text description

#### Structured Record Fields
- Record time
- Meal type
- Food item list
- Portion description
- Image attachment
- Original user input
- AI recognition summary
- Confirmation status

#### Acceptance Criteria
- After the user uploads an image, the system generates at least one candidate food record
- After the user sends text, the system extracts the meal type and food items
- The user can send photos and a text description together in one message
- The user can correct AI recognition results
- All records can enter the "Today Timeline"

---

### 8.3 Module C: Milk Intake and Supplement Logging

#### Description
In addition to solid foods, parents can log milk intake and supplements, which are important inputs for daily analysis.

#### Logged Content
- Formula / breast milk / mixed feeding
- Single serving amount (such as 120 ml / 180 ml)
- Supplements such as iron or vitamin D

#### User Value
- Makes the daily summary more complete
- Improves the reliability of calcium, energy, and iron intake assessment

#### Acceptance Criteria
- The user can quickly log a single milk feeding
- The user can set default routine supplements
- The daily report can show whether milk intake and supplements were covered

---

### 8.4 Module D: Daily Nutrition Analysis

#### Description
The system automatically generates a nutrition summary for the day at a fixed time.

#### Output
- Overview of today’s intake
- Nutritional areas covered today
  - Protein
  - Fat
  - Staple foods / carbohydrates
  - Vegetables
  - Fruit
  - Iron-rich foods
- Possible gaps
- Suggestions for the next day

#### Style Requirements
- Clear, concise, and actionable
- Avoid exaggerated or absolute conclusions
- Explicitly frame outputs as supportive suggestions

#### Acceptance Criteria
- The system supports a user-defined daily report time
- It can automatically generate a summary from the day’s records
- The summary can be saved and reviewed later

---

### 8.5 Module E: Weekly Nutrition Summary

#### Description
The system automatically aggregates the last 7 days of records each week and provides trend analysis.

#### Output
- Diet diversity
- Frequency of iron-rich foods
- Frequency of vegetable and fruit coverage
- Completion of milk intake and supplements
- Key suggestions for the week

#### User Value
- Lets users see trends, not just a single day
- Makes it easier to identify persistent weak spots

#### Acceptance Criteria
- The system can aggregate the most recent 7 days of records
- It can generate at least one trend-based recommendation
- The user can review historical weekly reports on a page

---

### 8.6 Module F: Age-based Growth Reminders

#### Description
Based on the baby’s birth date, the system proactively pushes reminders according to the current age stage.

#### Content Scope
- Feeding priorities
- Developmental milestones
- Safety precautions
- Interaction and play suggestions
- Routine and observation focus areas

#### Trigger Modes
- Scheduled reminders (for example, every two weeks or every month)
- User-initiated questions such as:
  - "What should I pay attention to at this age?"

#### User Value
- Reduces the time cost of researching parenting information
- Makes reminders more relevant to the baby’s current stage

#### Acceptance Criteria
- The system can calculate the relevant stage from the birth date
- It can generate reminder content on schedule
- Stage-specific guidance can be requested in chat at any time

---

### 8.7 Module G: Growth Review Pages

#### Description
Users can review feeding and growth records for the last 1 day, 7 days, and 30 days on dedicated pages.

#### Page Scope

##### Today Page
- What the baby ate today
- Today’s milk intake
- Today’s fruit / vegetable / protein coverage
- Today’s summary

##### Last 7 Days Page
- Daily summaries
- New food trials
- Count of iron-rich foods
- Daily report list

##### Last 30 Days Page
- Common food statistics
- Food diversity trends
- Weekly report rollups
- Age-based reminder timeline

#### Acceptance Criteria
- The user can view records from the last 7 and 30 days
- Each day’s record can be opened to view details
- Aggregated statistics are consistent with the underlying source records

---

## 9. User Stories

### 9.1 Logging
- As a mother, I want to upload a photo of my baby’s plate and have the system identify the food and log it for me, so I do not need to fill out many fields manually.
- As a father, I want to send a message saying "For lunch he had half a bowl of noodles and two pieces of beef," and have the system categorize it as a lunch record.
- As a caregiver, I want the system to ask "How much did the baby eat?" when recognition is uncertain, instead of guessing.

### 9.2 Analysis
- As a parent, I want to receive a simple summary every evening that tells me roughly how balanced today’s nutrition was.
- As a parent, I want to see weekly trends instead of relying on my own memory and judgment every day.

### 9.3 Reminders
- As a first-time parent, I want the system to remind me about feeding priorities and safety precautions based on the baby’s age.
- As a parent, I want reminders that reflect recent feeding records, not generic template advice.

### 9.4 Review
- As a parent, I want to quickly see what my baby ate, what might be lacking, and which new foods were tried over the last 7 days.
- As a parent, I want to be able to review historical records quickly during future pediatric discussions.

---

## 10. Key User Flows

### 10.1 First-time Use Flow
1. The user installs and opens the app
2. Registers or logs in
3. Creates a baby profile
4. Sets a daily summary time
5. Enters the main chat screen

### 10.2 Daily Logging Flow
1. The user sends a photo or a short message
2. The system recognizes the content and generates a draft record
3. If information is insufficient, the system asks follow-up questions
4. The user confirms or corrects the record
5. The record is written into the Today Timeline

### 10.3 Daily Report Flow
1. The user’s configured time is reached
2. The system pulls the day’s records
3. It runs rule-based analysis
4. It generates a natural-language summary
5. It pushes the summary to the user

### 10.4 Weekly Report Flow
1. A fixed weekly trigger fires
2. The system aggregates the last 7 days of data
3. It generates weekly trends and recommendations
4. It archives and pushes the report

---

## 11. Page Requirements

### 11.1 Main Chat Screen
#### Core Elements
- Message stream
- Image upload button
- Text input field
- Quick actions
  - Log breakfast
  - Log lunch
  - Log dinner
  - Log milk intake
  - View today’s summary

#### Goal
- Enable more than 80% of high-frequency actions to be completed on this page

---

### 11.2 Today Timeline Page
#### Content
- Show all of today’s records in chronological order
- Each record shows time, food, quantity, image, and AI summary
- Show today’s summary card at the top

---

### 11.3 Last 7 Days Page
#### Content
- Display the most recent 7 days in a calendar or list view
- Show one summary card per day
- Display key weekly trends at the top

---

### 11.4 Last 30 Days Page
#### Content
- Food diversity statistics
- Top common foods list
- Weekly report history
- Age-based reminder history

---

### 11.5 Baby Profile Page
#### Content
- Basic information
- Allergens
- Feeding mode
- Default supplements
- Reminder settings

---

## 12. Content and Recommendation Strategy

### 12.1 Recommendation Tone
- Gentle, direct, and actionable
- Use wording such as "may," "could consider," and "it is worth paying attention to"
- Avoid disease-diagnosis language

### 12.2 Risk Boundaries
The system must not:
- Diagnose nutritional deficiency disorders
- Replace a doctor by prescribing treatment
- Make deterministic medical judgments in abnormal situations

The system should:
- Recommend consulting a pediatrician when high-risk signs appear
- Clearly state that the judgment is incomplete when intake data is incomplete

---

## 13. Data and Intelligence Strategy

### 13.1 Data Sources
- User-uploaded images
- User chat text
- User corrections and feedback
- Baby profile
- Rule base / age-stage knowledge base

### 13.2 Principles for AI Use
- Image recognition is used to reduce logging effort, not to define final truth
- Ask users to confirm when needed
- Nutrition suggestions should primarily rely on rule-based judgment plus LLM wording
- Age-based reminders should be based on reviewed knowledge templates

---

## 14. Non-functional Requirements

### 14.1 Performance
- Provide an initial recognition response within 5 seconds after image upload
- Keep chat response time within 3 seconds when possible, excluding complex image analysis
- Load the most recent 7 days of records within 2 seconds

### 14.2 Reliability
- User records must not be lost
- Image upload failures must support retry
- Original records must still be preserved when analysis fails

### 14.3 Security and Privacy
- Baby photos and feeding data are sensitive family data
- By default, data is visible only to the family account
- Encrypt both transmission and storage
- Clearly inform users that AI will analyze uploaded content

### 14.4 Extensibility
Future versions should support:
- Multiple babies
- Sleep records
- Bowel movement records
- Height and weight
- Allergy tracking
- Family member collaboration

---

## 15. Success Metrics (MVP)

### 15.1 User Activity
- Day-1 retention
- Day-7 retention
- Weekly active users

### 15.2 Core Behaviors
- Average daily logging frequency per user
- Conversion rate from uploaded image to successful record
- User correction rate after record creation
- Daily report view rate
- Weekly report view rate

### 15.3 Product Value Validation
- Share of users who use the product continuously for more than 3 days
- Share of users who use the product continuously for more than 7 days
- Subjective user feedback: whether it is "easier to know how well the baby is eating"

---

## 16. Risks and Challenges

### 16.1 Unstable image recognition accuracy
Response:
- Output candidate results rather than absolute conclusions
- Build lightweight correction interactions

### 16.2 Weak user motivation for ongoing logging
Response:
- Reduce input cost
- Ensure daily and weekly reports are genuinely valuable
- Introduce small but stable positive feedback loops

### 16.3 Trust issues in nutrition recommendations
Response:
- Start with coarse-grained structural guidance
- Avoid overly precise or falsely precise conclusions
- Clearly warn when data is incomplete

### 16.4 Medical compliance boundaries
Response:
- Make disclaimers explicit
- Do not provide diagnoses
- Recommend offline medical care in abnormal situations

---

## 17. MVP Acceptance Summary

Before MVP launch, the product must support at minimum:
1. The user can create a baby profile
2. The user can upload an image and generate a feeding record
3. The user can log one meal or one milk feeding through chat
4. The system supports daily nutrition summaries
5. The system supports weekly nutrition summaries
6. The system supports age-based reminders
7. The user can view the last 7 and 30 days of historical records
8. Records, images, and reports can all be stored persistently
9. All suggestions are clearly marked as supportive guidance and do not replace medical advice

---

## 18. Future Versions (Non-MVP)

### v1.1
- Voice input
- Food library and common meal templates
- New food trial tracking
- Allergy observation reminders

### v1.2
- Height and weight logging
- Sleep and bowel movement logging
- Multi-role family collaboration
- Exportable PDF growth report

### v2.0
- Multi-baby support
- Personalized feeding plans
- Pediatrician / nutritionist collaboration interface
- More growth and development tracking capabilities

---

## 19. Conclusion

This product is best launched through a clear, high-frequency loop:
**Log baby feeding in chat -> generate analysis automatically -> provide regular reminders -> build a long-term growth record.**

MVP success does not depend on having many features. It depends on two things:
1. Whether logging is genuinely lightweight
2. Whether daily and weekly feedback is genuinely valuable

If those two conditions hold, the product has a real chance to build a strong daily usage habit and durable long-term retention.
