import { LanguageCode } from '../../types';

export interface TranslationSchema {
  appName: string;
  appSubtitle: string;
  nav: {
    doubtSolver: string;
    syllabusLibrary: string;
    revision: string;
    weakTopics: string;
    practice: string;
    modelSetup: string;
    settingsStorage: string;
    workspaceMenu: string;
    offlineReadiness: string;
  };
  status: {
    online: string;
    offline: string;
    offlineReadyShell: string;
    materialsLoaded: string;
    modelReady: string;
    modelNotLoaded: string;
    modelDownloading: string;
    modelLoading: string;
    modelUnavailable: string;
    modelError: string;
    installApp: string;
    installed: string;
  };
  doubt: {
    workspaceTitle: string;
    newDoubtSession: string;
    recentConversations: string;
    savedAnswersTab: string;
    noConversationsYet: string;
    noSavedAnswersYet: string;
    renameConversation: string;
    saveTitle: string;
    cancelRename: string;
    selectSubject: string;
    selectChapter: string;
    allChapters: string;
    explanationLevel: string;
    levelBasic: string;
    levelStandard: string;
    levelExamPrep: string;
    yourQuestionLabel: string;
    questionPlaceholder: string;
    mathExpressionLabel: string;
    mathExpressionPlaceholder: string;
    startWithHint: string;
    solveFull: string;
    askFollowUpPlaceholder: string;
    hintLadderTitle: string;
    hint1Label: string;
    hint2Label: string;
    hint3Label: string;
    revealNextHint: string;
    revealFullSolution: string;
    sec1WhatQuestionAsks: string;
    sec2ConceptFormula: string;
    sec3StepByStep: string;
    sec4FinalAnswer: string;
    sec5QuickVerification: string;
    sec6SyllabusSource: string;
    sec7PracticeQuestion: string;
    copyAnswer: string;
    copied: string;
    saveToRevision: string;
    savedToRevision: string;
    rateUnderstanding: string;
    understood: string;
    partiallyUnderstood: string;
    notUnderstood: string;
    generatedByGemma: string;
    generatedByLocalEngine: string;
    mathVerifiedBadge: string;
    mathMismatchBadge: string;
    mathUnsupportedBadge: string;
    mathNotApplicableBadge: string;
    ungroundedWarning: string;
    sampleQuestionsTitle: string;
    emptyQuestionError: string;
    savedSuccessNotice: string;
  };
  library: {
    title: string;
    subtitle: string;
    officialDisclaimer: string;
    importButton: string;
    searchPlaceholder: string;
    documentsTab: string;
    passageSearchTab: string;
    colTitle: string;
    colSubject: string;
    colClass: string;
    colSource: string;
    colPassages: string;
    colStatus: string;
    colAction: string;
    importModalTitle: string;
    docTitleLabel: string;
    subjectLabel: string;
    classLabel: string;
    chapterLabel: string;
    sourceLabel: string;
    fileUploadLabel: string;
    pasteContentLabel: string;
    submitImport: string;
    cancel: string;
    deleteDoc: string;
  };
  revision: {
    title: string;
    subtitle: string;
    dueForReview: string;
    totalCards: string;
    completedReviews: string;
    createCardButton: string;
    reviewNow: string;
    showAnswer: string;
    rateAgain: string;
    rateHard: string;
    rateGood: string;
    rateEasy: string;
    noCardsDue: string;
    allSavedCards: string;
    savedExplanationsTitle: string;
  };
  weakTopics: {
    title: string;
    subtitle: string;
    estimateDisclaimer: string;
    strongTopics: string;
    developingTopics: string;
    needsAttention: string;
    noActivityYet: string;
    logActivityHint: string;
  };
  practice: {
    title: string;
    subtitle: string;
    sourceImportedBank: string;
    sourceGemmaLocal: string;
    generateWithAIButton: string;
    aiUnavailableNote: string;
    checkAnswer: string;
    yourAnswerPlaceholder: string;
    showHint: string;
    showSolution: string;
    nextQuestion: string;
  };
  modelSetup: {
    title: string;
    subtitle: string;
    honestyBanner: string;
    threePillarsTitle: string;
    pillarShell: string;
    pillarMaterials: string;
    pillarModel: string;
    webGpuDiagnostics: string;
    providerSelection: string;
    testConnection: string;
    loadModelButton: string;
    unloadModelButton: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageSection: string;
    storageSection: string;
    privacyStatement: string;
    clearConversations: string;
    clearImportedDocs: string;
    exportBackup: string;
    confirmDelete: string;
  };
  subjects: {
    math_10: string;
    science_10: string;
    other: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationSchema> = {
  en: {
    appName: 'Offline AI Doubt Solver',
    appSubtitle: 'Private Local Study Assistant · Class 10 Mathematics & Science',
    nav: {
      doubtSolver: 'Doubt Solver',
      syllabusLibrary: 'Syllabus Library',
      revision: 'Revision Deck',
      weakTopics: 'Weak Topics',
      practice: 'Practice Bank',
      modelSetup: 'Model Setup (Gemma 4)',
      settingsStorage: 'Settings & Storage',
      workspaceMenu: 'Workspace Menu',
      offlineReadiness: 'Offline Components',
    },
    status: {
      online: 'Network Connected',
      offline: 'Offline Mode Active',
      offlineReadyShell: 'App Shell Cached',
      materialsLoaded: 'Local Syllabus Ready',
      modelReady: 'Gemma 4 Connected',
      modelNotLoaded: 'Gemma 4 Not Loaded (Using Local Math/Search Engine)',
      modelDownloading: 'Downloading Gemma 4',
      modelLoading: 'Probing Local Gemma 4 Runtime...',
      modelUnavailable: 'Gemma 4 Runtime Unavailable (Using Local Math/Search Engine)',
      modelError: 'Model Runtime Error',
      installApp: 'Install Offline App',
      installed: 'App Installed',
    },
    doubt: {
      workspaceTitle: 'Step-by-Step Doubt Solver',
      newDoubtSession: 'New Session',
      recentConversations: 'Conversations',
      savedAnswersTab: 'Saved Answers',
      noConversationsYet: 'No local conversations stored yet. Ask a question or select a sample problem below to begin.',
      noSavedAnswersYet: 'No saved answers yet. Click "Save to Revision Deck" on any explanation to store it here.',
      renameConversation: 'Rename conversation',
      saveTitle: 'Save',
      cancelRename: 'Cancel',
      selectSubject: 'Subject',
      selectChapter: 'Chapter',
      allChapters: 'All Chapters (Auto-Detect)',
      explanationLevel: 'Explanation Depth',
      levelBasic: 'Concept Foundation',
      levelStandard: 'Step-by-Step Standard',
      levelExamPrep: 'Board Exam Rigor',
      yourQuestionLabel: 'Your Question or Concept Doubt',
      questionPlaceholder: 'Type your Class 10 Maths or Science doubt (e.g., "Solve x^2 - 7x + 12 = 0" or "Explain Ohm\'s Law and find current if V=220V, R=1100Ω")...',
      mathExpressionLabel: 'Optional Math Expression to Verify Directly',
      mathExpressionPlaceholder: 'e.g., x^2 - 5x + 6 = 0 or (18 * 4) / 6 + sqrt(81)',
      startWithHint: 'Request Hint 1 First',
      solveFull: 'Show Full Step-by-Step Solution',
      askFollowUpPlaceholder: 'Ask a follow-up question in this conversation...',
      hintLadderTitle: 'Progressive Hint Ladder',
      hint1Label: 'Hint 1 · Identify the Concept',
      hint2Label: 'Hint 2 · Next Logical Step',
      hint3Label: 'Hint 3 · Detailed Setup',
      revealNextHint: 'Reveal Next Hint',
      revealFullSolution: 'Show Complete Solution',
      sec1WhatQuestionAsks: '1. What the Question is Asking',
      sec2ConceptFormula: '2. Relevant Concept & Formula',
      sec3StepByStep: '3. Step-by-Step Reasoning',
      sec4FinalAnswer: '4. Final Answer',
      sec5QuickVerification: '5. Independent Mathematics & Logic Verification',
      sec6SyllabusSource: '6. Local Syllabus Reference',
      sec7PracticeQuestion: '7. Check Your Understanding (Practice)',
      copyAnswer: 'Copy Solution',
      copied: 'Copied to Clipboard',
      saveToRevision: 'Save Answer & Revision Card',
      savedToRevision: 'Saved Locally',
      rateUnderstanding: 'Record your understanding for Weak-Topic Tracking:',
      understood: 'Understood',
      partiallyUnderstood: 'Partially Understood',
      notUnderstood: 'Not Understood',
      generatedByGemma: 'Generated locally by Gemma 4 Runtime',
      generatedByLocalEngine: 'Solved via Local Syllabus Retrieval & Math Engine (No AI Model Loaded)',
      mathVerifiedBadge: 'Independently Verified by Math Engine',
      mathMismatchBadge: 'Calculation Discrepancy Detected',
      mathUnsupportedBadge: 'Symbolic / Non-Numeric (Verification Unavailable)',
      mathNotApplicableBadge: 'Conceptual Topic (Math Verification Not Applicable)',
      ungroundedWarning: 'Outside Imported Syllabus: No matching passage was found in your locally stored study materials. This explanation is not grounded in your local library.',
      sampleQuestionsTitle: 'Try a Verified Class 10 Question',
      emptyQuestionError: 'Please enter a question or a mathematical expression before submitting.',
      savedSuccessNotice: 'Explanation saved to Local Saved Answers and Spaced-Revision Deck.',
    },
    library: {
      title: 'Local Study-Material Library',
      subtitle: 'Import, inspect, and search offline study notes and textbook passages on your device.',
      officialDisclaimer: 'Board Alignment Notice: Pre-loaded notes are a Foundational Reference Pack for Class 10 Maths & Science. They do not claim official state/central board certification unless you import your verified board syllabus documents.',
      importButton: 'Import Study Document',
      searchPlaceholder: 'Search local passages by keyword, formula, or theorem (e.g. "quadratic formula", "Ohm", "refraction")...',
      documentsTab: 'Stored Documents',
      passageSearchTab: 'Local Passage Search',
      colTitle: 'Document Title',
      colSubject: 'Subject',
      colClass: 'Class',
      colSource: 'Source & Verification',
      colPassages: 'Passages',
      colStatus: 'Import Status',
      colAction: 'Actions',
      importModalTitle: 'Import Local Study Document',
      docTitleLabel: 'Document Title',
      subjectLabel: 'Subject',
      classLabel: 'Class / Grade',
      chapterLabel: 'Chapter Mapping',
      sourceLabel: 'Source Attribution (e.g., School Notes, NCERT/State Textbook)',
      fileUploadLabel: 'Select Local Text File (.txt, .md, .json, or text-readable file)',
      pasteContentLabel: 'Or Paste Study Material Text Directly',
      submitImport: 'Chunk & Store Locally',
      cancel: 'Cancel',
      deleteDoc: 'Delete',
    },
    revision: {
      title: 'Spaced-Repetition Revision Deck & Saved Answers',
      subtitle: 'Review saved explanations and flashcards scheduled locally by your recall confidence.',
      dueForReview: 'Cards Due Now',
      totalCards: 'Total Stored Cards',
      completedReviews: 'Completed Reviews',
      createCardButton: 'Create Revision Card',
      reviewNow: 'Review Scheduled Cards',
      showAnswer: 'Reveal Answer & Formula',
      rateAgain: 'Again (< 1 day)',
      rateHard: 'Hard (2 days)',
      rateGood: 'Good (4 days)',
      rateEasy: 'Easy (7+ days)',
      noCardsDue: 'All caught up! Every scheduled card has been reviewed for now.',
      allSavedCards: 'All Revision Cards',
      savedExplanationsTitle: 'Saved Doubt Explanations',
    },
    weakTopics: {
      title: 'Weak-Topic & Progress Tracker',
      subtitle: 'Identify chapters that need extra practice based on your self-rated doubts and practice attempts.',
      estimateDisclaimer: 'Important Note: Topic mastery percentages are informal estimates calculated strictly from your recorded local learning activity (self-ratings and practice checks). They are not a formal academic assessment or exam grade.',
      strongTopics: 'Strong Understanding',
      developingTopics: 'Developing (Review Recommended)',
      needsAttention: 'Needs Immediate Focus',
      noActivityYet: 'No recorded ratings yet for this chapter.',
      logActivityHint: 'Mark answers as "Understood", "Partially Understood", or "Not Understood" in the Doubt Solver or complete Practice questions to populate this tracker.',
    },
    practice: {
      title: 'Offline Practice Question Bank',
      subtitle: 'Practice Class 10 Mathematics and Science questions with progressive hints and math verification.',
      sourceImportedBank: 'Imported Local Question Bank',
      sourceGemmaLocal: 'Generated by Local Gemma 4',
      generateWithAIButton: 'Generate New Question via Gemma 4',
      aiUnavailableNote: 'Local Gemma 4 model is not currently loaded. Practicing from verified local Question Bank (no fake AI responses used).',
      checkAnswer: 'Check & Verify Answer',
      yourAnswerPlaceholder: 'Enter your numerical or algebraic answer (e.g., 3, 4 or 47)...',
      showHint: 'Show Hint',
      showSolution: 'View Step-by-Step Solution',
      nextQuestion: 'Next Question',
    },
    modelSetup: {
      title: 'Local Gemma 4 Model Architecture & Setup',
      subtitle: 'Configure the modular LocalAIProvider adapter for private on-device Gemma 4 inference.',
      honestyBanner: 'Transparency Guarantee: This application never fakes AI model inference and never silently sends your questions to an online cloud API. When Gemma 4 is not loaded, the app uses its deterministic Local Syllabus & Math Engine and clearly labels every output.',
      threePillarsTitle: 'Three Independent Offline Requirements',
      pillarShell: '1. Application Shell (PWA Service Worker)',
      pillarMaterials: '2. Local Study Materials (IndexedDB Passages)',
      pillarModel: '3. Local Gemma 4 Model Runtime (WebGPU / Local Host)',
      webGpuDiagnostics: 'Hardware & Browser Runtime Diagnostics',
      providerSelection: 'Select Local Inference Runtime Adapter',
      testConnection: 'Probe Local Runtime Compatibility',
      loadModelButton: 'Connect & Verify Local Gemma 4 Runtime',
      unloadModelButton: 'Disconnect Runtime',
    },
    settings: {
      title: 'Settings, Language & Local Storage Management',
      subtitle: 'Control interface language, inspect IndexedDB storage footprint, and manage your local study data.',
      languageSection: 'Interface Language (English / தமிழ்)',
      storageSection: 'Local Device Storage Breakdown (IndexedDB)',
      privacyStatement: '100% Local Privacy: Your conversations, saved answers, imported documents, revision cards, and weak-topic history stay exclusively in your browser\'s IndexedDB storage on this device. Nothing is uploaded to external servers.',
      clearConversations: 'Delete All Stored Conversations',
      clearImportedDocs: 'Delete User-Imported Study Documents',
      exportBackup: 'Export Local Study Backup (JSON)',
      confirmDelete: 'Confirm Deletion',
    },
    subjects: {
      math_10: 'Class 10 Mathematics',
      science_10: 'Class 10 Science',
      other: 'General / Other Subject',
    },
  },
  ta: {
    appName: 'ஆஃப்லைன் AI சந்தேகத் தீர்ப்பான்',
    appSubtitle: 'தனிப்பட்ட உள்ளூர் கல்வி உதவியாளர் · 10-ஆம் வகுப்பு கணிதம் மற்றும் அறிவியல்',
    nav: {
      doubtSolver: 'சந்தேகம் தீர்க்க',
      syllabusLibrary: 'பாடத்திட்ட நூலகம்',
      revision: 'திருப்புதல் அட்டைகள்',
      weakTopics: 'கவனம் தேவைப்படும் தலைப்புகள்',
      practice: 'பயிற்சி வினாக்கள்',
      modelSetup: 'AI மாதிரி அமைப்பு (Gemma 4)',
      settingsStorage: 'அமைப்புகள் & சேமிப்பகம்',
      workspaceMenu: 'பணிப்பலகை மெனு',
      offlineReadiness: 'ஆஃப்லைன் நிலை',
    },
    status: {
      online: 'இணைய இணைப்பு உள்ளது',
      offline: 'ஆஃப்லைன் பயன்முறை',
      offlineReadyShell: 'செயலி தளம் சேமிக்கப்பட்டுள்ளது',
      materialsLoaded: 'பாடக் குறிப்புகள் தயார்',
      modelReady: 'Gemma 4 இணைக்கப்பட்டுள்ளது',
      modelNotLoaded: 'Gemma 4 ஏற்றப்படவில்லை (உள்ளூர் கணித/தேடல் இயந்திரம்)',
      modelDownloading: 'Gemma 4 பதிவிறக்கப்படுகிறது',
      modelLoading: 'Gemma 4 சோதிக்கப்படுகிறது...',
      modelUnavailable: 'Gemma 4 கிடைக்கவில்லை (உள்ளூர் கணித/தேடல் இயந்திரம்)',
      modelError: 'மாதிரி இயக்கப் பிழை',
      installApp: 'செயலியை நிறுவுக',
      installed: 'நிறுவப்பட்டது',
    },
    doubt: {
      workspaceTitle: 'படிப்படியான சந்தேகத் தீர்ப்பான்',
      newDoubtSession: 'புதிய உரையாடல்',
      recentConversations: 'உரையாடல்கள்',
      savedAnswersTab: 'சேமித்த விடைகள்',
      noConversationsYet: 'உரையாடல்கள் எதுவும் சேமிக்கப்படவில்லை. தொடங்க ஒரு கேள்வியைக் கேட்கவும்.',
      noSavedAnswersYet: 'சேமிக்கப்பட்ட விடைகள் இல்லை. விடையைச் சேமிக்க "திருப்புதலில் சேமி" என்பதைத் தேர்வு செய்யவும்.',
      renameConversation: 'பெயரை மாற்றுக',
      saveTitle: 'சேமி',
      cancelRename: 'ரத்து',
      selectSubject: 'பாடம்',
      selectChapter: 'பாடப்பிரிவு / அத்தியாயம்',
      allChapters: 'அனைத்து அத்தியாயங்களும்',
      explanationLevel: 'விளக்கத்தின் நிலை',
      levelBasic: 'அடிப்படை விளக்கம்',
      levelStandard: 'படிப்படியான விளக்கம்',
      levelExamPrep: 'பொதுத்தேர்வு தயாரிப்பு',
      yourQuestionLabel: 'உங்கள் கேள்வி அல்லது பாடச் சந்தேகம்',
      questionPlaceholder: '10-ஆம் வகுப்பு கணிதம் அல்லது அறிவியல் சந்தேகத்தை உள்ளிடவும் (எ.கா., "Solve x^2 - 7x + 12 = 0" அல்லது "ஓம் விதியை விளக்குக")...',
      mathExpressionLabel: 'சரிபார்க்க வேண்டிய கணிதக் கோவை (விருப்பத்தேர்வு)',
      mathExpressionPlaceholder: 'எ.கா., x^2 - 5x + 6 = 0 அல்லது (18 * 4) / 6 + sqrt(81)',
      startWithHint: 'முதலில் குறிப்பு 1 (Hint 1) காட்டுக',
      solveFull: 'முழுமையான தீர்வைக் காட்டுக',
      askFollowUpPlaceholder: 'தொடர்புடைய அடுத்த கேள்வியைக் கேட்கவும்...',
      hintLadderTitle: 'படிப்படியான குறிப்பு ஏணி (Hint Ladder)',
      hint1Label: 'குறிப்பு 1 · கருத்தைக் கண்டறிதல்',
      hint2Label: 'குறிப்பு 2 · அடுத்த படிநிலை',
      hint3Label: 'குறிப்பு 3 · விரிவான வழிகாட்டுதல்',
      revealNextHint: 'அடுத்த குறிப்பைக் காட்டு',
      revealFullSolution: 'முழுத் தீர்வைக் காட்டு',
      sec1WhatQuestionAsks: '1. கேள்வி என்ன கேட்கிறது',
      sec2ConceptFormula: '2. தொடர்புடைய கருத்து மற்றும் சூத்திரம்',
      sec3StepByStep: '3. படிப்படியான தீர்வு முறை',
      sec4FinalAnswer: '4. இறுதி விடை',
      sec5QuickVerification: '5. கணித இயந்திரச் சரிபார்ப்பு',
      sec6SyllabusSource: '6. உள்ளூர் பாடத்திட்ட ஆதாரம்',
      sec7PracticeQuestion: '7. பயிற்சி வினா',
      copyAnswer: 'விடையை நகலெடு',
      copied: 'நகலெடுக்கப்பட்டது',
      saveToRevision: 'விடை & திருப்புதல் அட்டையைச் சேமி',
      savedToRevision: 'சேமிக்கப்பட்டது',
      rateUnderstanding: 'உங்கள் புரிதல் நிலையைப் பதிவு செய்க:',
      understood: 'நன்கு புரிந்தது',
      partiallyUnderstood: 'ஓரளவு புரிந்தது',
      notUnderstood: 'புரியவில்லை',
      generatedByGemma: 'உள்ளூர் Gemma 4 மாதிரியால் உருவாக்கப்பட்டது',
      generatedByLocalEngine: 'உள்ளூர் பாடத்திட்டம் மற்றும் கணித இயந்திரம் மூலம் தீர்க்கப்பட்டது (AI மாதிரி இயங்கவில்லை)',
      mathVerifiedBadge: 'கணித இயந்திரத்தால் சரிபார்க்கப்பட்டது',
      mathMismatchBadge: 'கணக்கீட்டு வேறுபாடு கண்டறியப்பட்டது',
      mathUnsupportedBadge: 'குறியீட்டுக் கணக்கு (நேரடிச் சரிபார்ப்பு இல்லை)',
      mathNotApplicableBadge: 'கருத்துசார் கேள்வி (கணிதச் சரிபார்ப்பு தேவையில்லை)',
      ungroundedWarning: 'பாடத்திட்டத்திற்கு வெளியேயான கேள்வி: சேமிக்கப்பட்டுள்ள உள்ளூர் பாடக் குறிப்புகளில் இதற்கான நேரடி ஆதாரம் இல்லை.',
      sampleQuestionsTitle: 'மாதிரி 10-ஆம் வகுப்பு வினாக்களை முயற்சிக்கவும்',
      emptyQuestionError: 'தயவுசெய்து ஒரு கேள்வி அல்லது கணிதக் கோவையை உள்ளிடவும்.',
      savedSuccessNotice: 'விடை உள்ளூர் சேமிப்பகத்திலும் திருப்புதல் அட்டையிலும் சேமிக்கப்பட்டது.',
    },
    library: {
      title: 'உள்ளூர் பாடக் குறிப்புகள் நூலகம்',
      subtitle: 'பாடக் குறிப்புகளை இறக்குமதி செய்து இணையம் இல்லாமல் தேடுங்கள்.',
      officialDisclaimer: 'அறிவிப்பு: இதில் உள்ள அடிப்படைக் குறிப்புகள் மாதிரி கற்றலுக்கானவை. அதிகாரப்பூர்வ பாடநூல் கோப்புகளை நீங்கள் இறக்குமதி செய்து கொள்ளலாம்.',
      importButton: 'பாட ஆவணத்தை இறக்குமதி செய்',
      searchPlaceholder: 'சூத்திரம் அல்லது முக்கியச் சொற்கள் மூலம் தேடுக...',
      documentsTab: 'சேமிக்கப்பட்ட ஆவணங்கள்',
      passageSearchTab: 'பாடப் பகுதி தேடல்',
      colTitle: 'ஆவணத்தின் தலைப்பு',
      colSubject: 'பாடம்',
      colClass: 'வகுப்பு',
      colSource: 'ஆதாரம்',
      colPassages: 'பகுதிகள்',
      colStatus: 'நிலை',
      colAction: 'செயல்',
      importModalTitle: 'உள்ளூர் பாட ஆவணத்தைச் சேர்க்க',
      docTitleLabel: 'ஆவணத் தலைப்பு',
      subjectLabel: 'பாடம்',
      classLabel: 'வகுப்பு',
      chapterLabel: 'அத்தியாயம்',
      sourceLabel: 'ஆதார விவரம் (எ.கா. பள்ளிக் குறிப்புகள்)',
      fileUploadLabel: 'உரைக் கோப்பைத் தேர்ந்தெடுக்கவும் (.txt, .md, .json)',
      pasteContentLabel: 'அல்லது பாட உரையை இங்கே ஒட்டவும்',
      submitImport: 'பிரித்து உள்ளூரில் சேமி',
      cancel: 'ரத்து செய்',
      deleteDoc: 'நீக்கு',
    },
    revision: {
      title: 'இடைவெளித் திருப்புதல் அட்டைகள் (Spaced Revision)',
      subtitle: 'சேமித்த வினா-விடைகளைச் சரியான கால இடைவெளியில் திருப்புதல் செய்யுங்கள்.',
      dueForReview: 'இன்று திருப்புதல் செய்ய வேண்டியவை',
      totalCards: 'மொத்த அட்டைகள்',
      completedReviews: 'நிறைவு செய்த திருப்புதல்கள்',
      createCardButton: 'புதிய திருப்புதல் அட்டை உருவாக்கு',
      reviewNow: 'திருப்புதல் தொடங்கு',
      showAnswer: 'விடையைக் காட்டு',
      rateAgain: 'மீண்டும் (< 1 நாள்)',
      rateHard: 'கடினம் (2 நாட்கள்)',
      rateGood: 'நன்று (4 நாட்கள்)',
      rateEasy: 'எளிது (7+ நாட்கள்)',
      noCardsDue: 'இன்றைய திருப்புதல் அட்டைகள் அனைத்தும் நிறைவடைந்தன!',
      allSavedCards: 'அனைத்து திருப்புதல் அட்டைகளும்',
      savedExplanationsTitle: 'சேமிக்கப்பட்ட சந்தேக விளக்கங்கள்',
    },
    weakTopics: {
      title: 'கவனம் தேவைப்படும் தலைப்புகள் (Weak-Topic Tracker)',
      subtitle: 'உங்கள் கற்றல் செயல்பாட்டின் அடிப்படையில் கூடுதல் பயிற்சி தேவைப்படும் பாடப்பிரிவுகள்.',
      estimateDisclaimer: 'முக்கியக் குறிப்பு: இந்த மதிப்பீடு நீங்கள் பதிவு செய்த புரிதல் நிலைகளின் அடிப்படையிலான தோராயமான கணிப்பு மட்டுமே; இது அதிகாரப்பூர்வத் தேர்வு மதிப்பெண் அல்ல.',
      strongTopics: 'நன்கு புரிந்த தலைப்புகள்',
      developingTopics: 'முன்னேறி வரும் தலைப்புகள்',
      needsAttention: 'கூடுதல் கவனம் தேவை',
      noActivityYet: 'இப்பாடப்பிரிவில் இன்னும் செயல்பாடு பதிவு செய்யப்படவில்லை.',
      logActivityHint: 'சந்தேகம் தீர்க்கும் பகுதியில் உங்கள் புரிதல் நிலையைப் பதிவு செய்தால் இங்கே முன்னேற்றம் கணக்கிடப்படும்.',
    },
    practice: {
      title: 'ஆஃப்லைன் பயிற்சி வினா வங்கி',
      subtitle: '10-ஆம் வகுப்பு கணிதம் மற்றும் அறிவியல் பயிற்சி வினாக்கள்.',
      sourceImportedBank: 'உள்ளூர் வினா வங்கி',
      sourceGemmaLocal: 'Gemma 4 உருவாக்கிய வினா',
      generateWithAIButton: 'Gemma 4 மூலம் புதிய வினா உருவாக்கு',
      aiUnavailableNote: 'Gemma 4 மாதிரி தற்போது இயங்காததால் உள்ளூர் வினா வங்கியிலிருந்து உண்மையான வினாக்கள் வழங்கப்படுகின்றன.',
      checkAnswer: 'விடையைச் சரிபார்',
      yourAnswerPlaceholder: 'உங்கள் விடையை உள்ளிடவும்...',
      showHint: 'குறிப்பு காட்டு',
      showSolution: 'படிப்படியான தீர்வைக் காட்டு',
      nextQuestion: 'அடுத்த வினா',
    },
    modelSetup: {
      title: 'உள்ளூர் Gemma 4 AI மாதிரி அமைப்பு',
      subtitle: 'இணையம் இல்லாமல் சாதனத்திலேயே இயங்கும் Gemma 4 மாதிரியை இணைப்பதற்கான அமைப்பு.',
      honestyBanner: 'உண்மைத்தன்மை உறுதிமொழி: AI மாதிரி இயங்காதபோது போலியான AI பதில்களை இச்செயலி ஒருபோதும் காட்டாது. மாறாக உள்ளூர் பாடத்திட்டத் தேடல் மற்றும் கணித இயந்திரத்தைப் பயன்படுத்தி தெளிவாகக் குறிப்பிடும்.',
      threePillarsTitle: 'ஆஃப்லைன் செயல்பாட்டின் மூன்று தனித்தனி நிலைகள்',
      pillarShell: '1. செயலி தளம் (PWA App Shell)',
      pillarMaterials: '2. உள்ளூர் பாடக் குறிப்புகள் (IndexedDB)',
      pillarModel: '3. உள்ளூர் Gemma 4 AI மாதிரி (WebGPU / Local Runtime)',
      webGpuDiagnostics: 'சாதன மற்றும் உலாவித் தகுதிப் பரிசோதனை',
      providerSelection: 'AI இயக்க முறையைத் தேர்ந்தெடுக்கவும்',
      testConnection: 'இணைப்புத் தகுதியைச் சோதிக்கவும்',
      loadModelButton: 'உள்ளூர் Gemma 4 மாதிரியை இணைக்கவும்',
      unloadModelButton: 'இணைப்பைத் துண்டி',
    },
    settings: {
      title: 'அமைப்புகள், மொழி மற்றும் உள்ளூர் சேமிப்பகம்',
      subtitle: 'செயலியின் மொழி மற்றும் உங்கள் சாதனத்தில் சேமிக்கப்பட்டுள்ள தரவுகளை நிர்வகிக்கவும்.',
      languageSection: 'செயலி மொழி (Interface Language)',
      storageSection: 'உள்ளூர் சேமிப்பக விவரம் (IndexedDB)',
      privacyStatement: '100% தனியுரிமை: உங்கள் உரையாடல்கள், சேமித்த விடைகள், பாடக் குறிப்புகள் மற்றும் கற்றல் முன்னேற்றம் அனைத்தும் உங்கள் சாதனத்தில் மட்டுமே சேமிக்கப்படுகின்றன.',
      clearConversations: 'அனைத்து உரையாடல்களையும் நீக்கு',
      clearImportedDocs: 'இறக்குமதி செய்த ஆவணங்களை நீக்கு',
      exportBackup: 'தரவுகளைக் கோப்பாகப் பதிவிறக்கு (JSON)',
      confirmDelete: 'நீக்குவதை உறுதிப்படுத்து',
    },
    subjects: {
      math_10: '10-ஆம் வகுப்பு கணிதம்',
      science_10: '10-ஆம் வகுப்பு அறிவியல்',
      other: 'பிற பாடங்கள்',
    },
  },
};
