export const mealIdeasFixtures = {
  suggestionSet: {
    recommendationDate: "2026-03-18",
    title: "Tomorrow's meal ideas",
    intro: "Texture-building guidance is pointing to a short, practical plan for the next day.",
    caveat: "This suggestion set is based on limited recent logging, so keep the next meal simple and easy to log.",
    footer:
      "This is supportive guidance only. Adjust the plan to appetite, allergies, and whatever your family can realistically serve.",
    sections: [
      {
        templateKey: "iron_priority",
        mealType: "lunch",
        priority: 1,
        headline: "Lead with one iron-rich lunch",
        body: "Iron-rich foods have been less visible lately, so lunch is the clearest place to repeat one reliable option.",
        options: ["mashed beans", "shredded beef", "soft lentils"],
        focusTags: ["iron_rich_food", "protein"],
      },
      {
        templateKey: "vegetable_variety",
        mealType: "dinner",
        priority: 2,
        headline: "Repeat one simple vegetable at dinner",
        body: "Vegetable variety has stayed narrow, so keep dinner calm and recognizable instead of chasing novelty.",
        options: ["steamed broccoli", "mashed peas", "roasted carrot"],
        focusTags: ["vegetable_variety"],
      },
      {
        templateKey: "repeat_breaker",
        mealType: "breakfast",
        priority: 3,
        headline: "Break the familiar repeat at breakfast",
        body: "The same easy foods have shown up a lot recently, so breakfast can introduce one gentle change without overcomplicating the day.",
        options: ["full-fat yogurt with pear", "oatmeal with chia", "banana with almond butter"],
        focusTags: ["variety", "repeat_breaker"],
      },
    ],
  },
};
