import React, { useState, useMemo, useEffect, useCallback, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import './Books.css';

/* ── Subject metadata ─────────────────────────────────────── */
const BOOKS_META = [
    {
        id: 1, title: 'Mathematics', slug: 'std_10_mathematics', subject: 'Math',
        icon: '📐', iconBg: '#EFF6FF', iconColor: '#2563EB',
        badgeColor: '#2563EB', badgeBg: '#EFF6FF',
    },
    {
        id: 2, title: 'First Flight', slug: 'std_10_english_First Flight', subject: 'English',
        icon: '📖', iconBg: '#F0FDF4', iconColor: '#16A34A',
        badgeColor: '#15803D', badgeBg: '#DCFCE7',
    },
    {
        id: 3, title: 'Footprints without Feet', slug: 'std_10_english_Footprints without Feet', subject: 'English',
        icon: '📘', iconBg: '#EFF6FF', iconColor: '#0284C7',
        badgeColor: '#0369A1', badgeBg: '#E0F2FE',
    },
    {
        id: 4, title: 'Hindi Kshitij-2', slug: 'std_10_hindi_Kshitij-2', subject: 'Hindi',
        icon: '📙', iconBg: '#FFF1F2', iconColor: '#BE123C',
        badgeColor: '#BE123C', badgeBg: '#FFE4E6',
    },
    {
        id: 5, title: 'Hindi Kritika', slug: 'std_10_hindi_Kritika', subject: 'Hindi',
        icon: '📔', iconBg: '#FFF7ED', iconColor: '#C2410C',
        badgeColor: '#C2410C', badgeBg: '#FFEDD5',
    },
    {
        id: 6, title: 'Hindi Sanchayan Bhag-2', slug: 'std _10_hindi_Sanchayan Bhag-2', subject: 'Hindi',
        icon: '📕', iconBg: '#FDF2F8', iconColor: '#BE185D',
        badgeColor: '#BE185D', badgeBg: '#FCE7F3',
    },
    {
        id: 7, title: 'Hindi Sparsh', slug: 'std_10_hindi_Sparsh', subject: 'Hindi',
        icon: '📗', iconBg: '#EEF2FF', iconColor: '#4338CA',
        badgeColor: '#4338CA', badgeBg: '#E0E7FF',
    },
    {
        id: 8, title: 'Science', slug: 'std_10_science', subject: 'Science',
        icon: '🔬', iconBg: '#F0FDFA', iconColor: '#0F766E',
        badgeColor: '#0F766E', badgeBg: '#CCFBF1',
    },
    {
        id: 9, title: 'Understanding Economic Development', slug: 'std_10_social_science_Understanding Economic Development', subject: 'Economics',
        icon: '💹', iconBg: '#ECFDF5', iconColor: '#047857',
        badgeColor: '#047857', badgeBg: '#D1FAE5',
    },
    {
        id: 10, title: 'India and the Contemporary World-II', slug: 'std_10_social science_India and the Contemporary World-II', subject: 'History',
        icon: '🌏', iconBg: '#FFF7ED', iconColor: '#C2410C',
        badgeColor: '#C2410C', badgeBg: '#FFEDD5',
    },
    {
        id: 11, title: 'Democratic Politics', slug: 'std_10_social science_Democratic Politics', subject: 'Civics',
        icon: '🏛️', iconBg: '#EEF2FF', iconColor: '#3730A3',
        badgeColor: '#3730A3', badgeBg: '#E0E7FF',
    },
    {
        id: 12, title: 'Contemporary India', slug: 'std_10_social science_Contemporary India', subject: 'Geography',
        icon: '🗺️', iconBg: '#FEF3C7', iconColor: '#B45309',
        badgeColor: '#B45309', badgeBg: '#FEF3C7',
    },
    {
        id: 13, title: 'Sanskrit Abhyaswaan Bhav II', slug: 'std_10_sanskrit_Abhyaswaan Bhav II', subject: 'Sanskrit',
        icon: '📜', iconBg: '#FDF2F8', iconColor: '#9D174D',
        badgeColor: '#9D174D', badgeBg: '#FCE7F3',
    },
    {
        id: 14, title: 'Sanskrit Shemushi', slug: 'std_10_sanskrit_Shemushi', subject: 'Sanskrit',
        icon: '🪶', iconBg: '#FDF2F8', iconColor: '#BE185D',
        badgeColor: '#BE185D', badgeBg: '#FCE7F3',
    },
    {
        id: 15, title: 'Sanskrit Vyakaranavithi', slug: 'std_10_sanskrit_Vyakaranavithi', subject: 'Sanskrit',
        icon: '📖', iconBg: '#EEF2FF', iconColor: '#4338CA',
        badgeColor: '#4338CA', badgeBg: '#E0E7FF',
    },
    {
        id: 16, title: 'Health and Physical Education', slug: 'std_10_Health and Physical Education', subject: 'Health and Physical Education',
        icon: '🏃', iconBg: '#F7FEE7', iconColor: '#4D7C0F',
        badgeColor: '#4D7C0F', badgeBg: '#ECFCCB',
    },
];

const FILTERS = ['All Books', 'Recently Opened', 'Completed', 'Favorites', 'Pending'];

/* ── Video Data Mapping ───────────────────────────────────── */
const VIDEO_DATA = {
    'std_10_mathematics': [
        { id: 1, title: 'Chapter 1: Real Numbers', videoId: '4D-dmN1bCG8' },
        { id: 2, title: 'Chapter 2: Polynomials', videoId: 'jUlvK--l1jI' },
        { id: 3, title: 'Chapter 3: Pair of Linear Equations in Two Variables', videoId: '3VpHW28f_j0' },
        { id: 4, title: 'Chapter 4: Quadratic Equations', videoId: 'YBPLMXAfA1g' },
        { id: 5, title: 'Chapter 5: Arithmetic Progressions', videoId: 'PCdPX2NKlaA' },
        { id: 6, title: 'Chapter 6: Triangles', videoId: 'XICgteZxIqg' },
        { id: 7, title: 'Chapter 7: Coordinate Geometry', videoId: 'nQ2CmKoYWPM' },
        { id: 8, title: 'Chapter 8: Introduction to Trigonometry', videoId: 'W7-Ts1xS_YY' },
        { id: 9, title: 'Chapter 9: Applications of Trigonometry', videoId: 'iI-jIuoioKI' },
        { id: 10, title: 'Chapter 10: Circles', videoId: 'YFYOxvUCWEY' },
        { id: 11, title: 'Chapter 11: Areas Related to Circles', videoId: 'tJ5_dU9nixU' },
        { id: 12, title: 'Chapter 12: Surface Areas and Volumes', videoId: 'clPTYFJeP78' },
        { id: 13, title: 'Chapter 13: Statistics', videoId: 'Qg_vW71NnT0' },
        { id: 14, title: 'Chapter 14: Probability', videoId: 'LGXtE_wR5VA' }
    ],
    'std_10_english_First Flight': [
        { id: 1, title: 'Chapter 1: A Letter to God', videoId: 'VfRZ2gUKmIY' },
        { id: 2, title: 'Chapter 2: Nelson Mandela: Long Walk to Freedom', videoId: 'NKim-KNBd5g' },
        { id: 3, title: 'Chapter 3: Two Stories about Flying', videoId: 'ps42mTP9Jws' },
        { id: 4, title: 'Chapter 4: From the Diary of Anne Frank', videoId: 'k02Enm-GS54' },
        { id: 5, title: 'Chapter 5: Glimpses of India', videoId: 'ti6HsLpeEfA' },
        { id: 6, title: 'Chapter 6: Mijbil the Otter', videoId: 'PCzavqsBT68' },
        { id: 7, title: 'Chapter 7: Madam Rides the Bus', videoId: 'vxAb8ECdNK0' },
        { id: 8, title: 'Chapter 8: The Sermon at Benares', videoId: '5Np1mMJ_MZk' },
        { id: 9, title: 'Chapter 9: The Proposal', videoId: 'ZrJsp2JrfYQ' }
    ],
        'std_10_science': [
        { id: 1, title: 'Chapter 1: Chemical Reactions and Equations', videoId: 'w80k9AopRig' },
        { id: 2, title: 'Chapter 2: Acids, Bases and Salts', videoId: '7lOLYCMl5cQ' },
        { id: 3, title: 'Chapter 3: Metals and Non-metals', videoId: '8UJCNqqwmYo' },
        { id: 4, title: 'Chapter 4: Carbon and its Compounds', videoId: 'ao45PaqNU7k' },
        { id: 5, title: 'Chapter 5: Life Processes', videoId: 'JmsAnnzlMfs' },
        { id: 6, title: 'Chapter 6: Control and Coordination', videoId: 'MeDj_7tjpQ8' },
        { id: 7, title: 'Chapter 7: How do Organisms Reproduce?', videoId: 'e8AXlaI0E68' },
        { id: 8, title: 'Chapter 8: Heredity', videoId: 'X-SJfASlsWA' },
        { id: 9, title: 'Chapter 9: Light – Reflection and Refraction', videoId: 'Me5ehNcvULw' },
        { id: 10, title: 'Chapter 10: The Human Eye and the Colourful World', videoId: 'XAXvtNWcop4' },
        { id: 11, title: 'Chapter 11: Electricity', videoId: 'NOR9D7Pkrcc' },
        { id: 12, title: 'Chapter 12: Magnetic Effects of Electric Current', videoId: 'lYGBsKJ0LYs' },
        { id: 13, title: 'Chapter 13: Our Environment', videoId: 'cxNs6EnXLOU' }
    ],
    'std_10_hindi_Kshitij-2': [
        { id: 1, title: 'Chapter 1: सूरदास', videoId: 'AMRpWtOdOKk' },
        { id: 2, title: 'Chapter 2: तुलसीदास', videoId: 'qJd1fVKrbfI' },
        { id: 3, title: 'Chapter 3: देव', videoId: '6j9MhUAjmiM' },
        { id: 4, title: 'Chapter 4: सूर्यकांत त्रिपाठी ‘निराला’', videoId: 'lCx8AnE3nDM' },
        { id: 5, title: 'Chapter 5: नागार्जुन', videoId: '_lSHGdVGv1Q' },
        { id: 6, title: 'Chapter 6: मंगलेश डबराल', videoId: 'pxC7pwFL4g8' },
        { id: 7, title: 'Chapter 7: स्वयं प्रकाश', videoId: 'gfbVZjtcZ_c' },
        { id: 8, title: 'Chapter 8: रामवृक्ष बेनीपुरी', videoId: '8mg6iD-TutY' },
        { id: 9, title: 'Chapter 9: यशपाल', videoId: 'Izq4CBNeKjc' },
        { id: 10, title: 'Chapter 10: मन्नू भंडारी', videoId: 'TO_ZtRhzrdM' },
        { id: 11, title: 'Chapter 11: वृंदावन लाल वर्मा', videoId: 'xRDsodafAW8' },
        { id: 12, title: 'Chapter 12: भदंत आनंद कौसल्यायन', videoId: '6uXfN_TbwqQ' }
    ],
    'std _10_hindi_Sanchayan Bhag-2': [
        { id: 1, title: 'Chapter 1: हरिशंकर परसाई – हरिहर काका', videoId: 'upxFku2kfKc' },
        { id: 2, title: 'Chapter 2: गुरदयाल सिंह – सपनों के से दिन', videoId: 'KRAG196vMpw' },
        { id: 3, title: 'Chapter 3: राही मासूम रज़ा – टोपी शुक्ला', videoId: 'NaSmRz3YSko' }
    ],
    'std_10_hindi_Sparsh': [
        { id: 1, title: 'Chapter 1: कबीर', videoId: 'fp4NoLOXxkI' },
        { id: 2, title: 'Chapter 2: मीरा – पद', videoId: 'wzCAX7MQpmg' },
        { id: 3, title: 'Chapter 3: मैथिलीशरण गुप्त – मनुष्यता', videoId: 'wzCAX7MQpmg' },
        { id: 4, title: 'Chapter 4: सुमित्रानंदन पंत – पर्वत प्रदेश में पावस', videoId: 'HvHnS9wbJJk' },
        { id: 5, title: 'Chapter 5: सूर्यकांत त्रिपाठी निराला – तोड़ती पत्थर', videoId: '47Vs9O6n8JM' },
        { id: 6, title: 'Chapter 6: केदारनाथ अग्रवाल – कर चले हम फिदा', videoId: 'zHH4Oc42_sM' },
        { id: 7, title: 'Chapter 7: रवीन्द्रनाथ ठाकुर – आत्मकथा', videoId: 'MjpSxkViTyg' },
        { id: 8, title: 'Chapter 8: प्रेमचंद – बड़े भाई साहब', videoId: 'Rd6vilrD440' },
        { id: 9, title: 'Chapter 9: सीताराम सेकसरिया – डायरी का एक पन्ना', videoId: '_dHazsLqr4I' },
        { id: 10, title: 'Chapter 10: लीलाधर मंडलोई – ताताँरा-वामीरो कथा', videoId: '756_HsIzMgM' },
        { id: 11, title: 'Chapter 11: प्रहलाद अग्रवाल – तीसरी कसम के शिल्पकार शैलेन्द्र', videoId: 'n7kqGCiQ4xA' },
        { id: 12, title: 'Chapter 12: नंद किशोर नवल – अब कहाँ दूसरे के दुख से दुखी होने वाले', videoId: 'YARIf30dzpU' },
        { id: 13, title: 'Chapter 13: रविंद्र केलकर – पतझर में टूटी पत्तियाँ', videoId: 'fiew-74s4pA' },
        { id: 14, title: 'Chapter 14: हबीब तनवीर – कारतूस (एकांकी)', videoId: 'LR9O7ThDRkA' }
    ],
    'std_10_social science_Contemporary India': [
        { id: 1, title: 'Chapter 1: Resources and Development', videoId: 'VzFLTwPmbvk' },
        { id: 2, title: 'Chapter 2: Forest and Wildlife Resources', videoId: 'zR526dbscZg' },
        { id: 3, title: 'Chapter 3: Water Resources', videoId: '0icCbK1IT2g' },
        { id: 4, title: 'Chapter 4: Agriculture', videoId: 'WhkUokWztRM' },
        { id: 5, title: 'Chapter 5: Minerals and Energy Resources', videoId: 'yJ559nLmHyY' },
        { id: 6, title: 'Chapter 6: Manufacturing Industries', videoId: 'squfJHQkm5A' },
        { id: 7, title: 'Chapter 7: Lifelines of National Economy', videoId: 'Uv46TyHQwj0' }
    ],
    'std_10_social science_Democratic Politics': [
        { id: 1, title: 'Chapter 1: Power-sharing', videoId: 'jlnlP_2dW5M' },
        { id: 2, title: 'Chapter 2: Federalism', videoId: 'sEK76uqgJOA' },
        { id: 3, title: 'Chapter 3: Gender, Religion and Caste', videoId: 'GBZ_Gnka7ZU' },
        { id: 4, title: 'Chapter 4: Political Parties', videoId: 'Z4tvJafNXJc' },
        { id: 5, title: 'Chapter 5: Outcomes of Democracy', videoId: 'D6qV-NCx0pk' }
    ],
    'std_10_english_Footprints without Feet': [
        { id: 1, title: 'Chapter 1: A Triumph of Surgery', videoId: 'sAgRPfiTOA0' },
        { id: 2, title: 'Chapter 2: The Thief’s Story', videoId: 'PUbKypWHvqo' },
        { id: 3, title: 'Chapter 3: The Midnight Visitor', videoId: 'wip1GRILdVk' },
        { id: 4, title: 'Chapter 4: A Question of Trust', videoId: 'XWg55skfubI' },
        { id: 5, title: 'Chapter 5: Footprints without Feet', videoId: 'X-7ocYHrf70' },
        { id: 6, title: 'Chapter 6: The Making of a Scientist', videoId: 'pqDeaFcBwO8' },
        { id: 7, title: 'Chapter 7: The Necklace', videoId: '3WA0z0Bdvr8' },
        { id: 8, title: 'Chapter 8: Bholi', videoId: 'JaBthNgs2V4' },
        { id: 9, title: 'Chapter 9: The Book That Saved the Earth', videoId: 'Si8uiDGqSrw' }
    ],
    'std_10_Health and Physical Education': [
        { id: 1, title: 'Chapter 1: Physical Education: Relation with other Subjects', videoId: '3S8I4ba9obI' },
        { id: 2, title: 'Chapter 2: Effects of Physical Activities on Human Body', videoId: 'ba0Lqlhc0Yc' },
        { id: 3, title: 'Chapter 3: Growth and Development during Adolescence', videoId: 'HEd6dwtKgY8' },
        { id: 4, title: 'Chapter 4: Individual Games and Sports I', videoId: 'vzI9q9b18V4' },
        { id: 5, title: 'Chapter 5: Individual Games and Sports II (Part 1)', videoId: 'uCjoCHC-EVg' },
        { id: 6, title: 'Chapter 5: Individual Games and Sports II (Part 2)', videoId: 'Vaef8r_5R_w' },
        { id: 7, title: 'Chapter 6: Team Games and Sports I (Part 1)', videoId: 'lbHuA1pqUlw' },
        { id: 8, title: 'Chapter 6: Team Games and Sports I (Part 2)', videoId: 'gBf7rDK27Hs' },
        { id: 9, title: 'Chapter 6: Team Games and Sports I (Part 3)', videoId: '73l371RtelI' },
        { id: 10, title: 'Chapter 6: Team Games and Sports I (Part 4)', videoId: 'Lvke9Ib-WeY' },
        { id: 11, title: 'Chapter 6: Team Games and Sports I (Part 5)', videoId: 'FZBX4Mddi68' },
        { id: 12, title: 'Chapter 7: Team Games and Sports II (Part 1)', videoId: 'UTXZy9plHlg' },
        { id: 13, title: 'Chapter 7: Team Games and Sports II (Part 2)', videoId: '22hm3FP0qBs' },
        { id: 14, title: 'Chapter 7: Team Games and Sports II (Part 3)', videoId: 'jslpVcjU810' },
        { id: 15, title: 'Chapter 7: Team Games and Sports II (Part 4)', videoId: '0bZBStnQG_4' },
        { id: 16, title: 'Chapter 7: Team Games and Sports II (Part 5)', videoId: 'MadvWYiCdbM' },
        { id: 17, title: 'Chapter 8: Yoga for Healthy Living', videoId: '7F4P9FRKXgA' },
        { id: 18, title: 'Chapter 10: Safety Measures for Healthy Living', videoId: 'FM8va4vDkvE' }
    ],
    'std_10_social science_India and the Contemporary World-II': [
        { id: 1, title: 'Chapter 1: The Rise of Nationalism in Europe', videoId: 'GDlWkr6sAT4' },
        { id: 2, title: 'Chapter 2: Nationalism in India', videoId: 'n96yn8IfE-4' },
        { id: 3, title: 'Chapter 3: The Making of a Global World', videoId: 'aOGabO1zrsU' },
        { id: 4, title: 'Chapter 4: The Age of Industrialisation', videoId: 'vTe0iIaCtT4' },
        { id: 5, title: 'Chapter 5: Print Culture and the Modern World', videoId: '8osoP6PNtoQ' }
    ],
    'std_10_sanskrit_Abhyaswaan Bhav II': [
        { id: 1, title: 'Chapter 1: अपठितावबोधनम्', videoId: 'Z_Ky0_wN1WI' },
        { id: 2, title: 'Chapter 2: पत्रलेखनम्', videoId: 'X85RXCv-aE0' },
        { id: 3, title: 'Chapter 3: अनुवादलेखनम्', videoId: 'cr20XGEmY9A' },
        { id: 4, title: 'Chapter 4: चित्रवर्णनम्', videoId: 'T1umIkh4ytw' },
        { id: 5, title: 'Chapter 5: रचनानुवादः (वाक्यरचनाकौशलम्)', videoId: 'biUI4DYJ8oQ' },
        { id: 6, title: 'Chapter 6: सन्धिः', videoId: 'Bb3WodDpn4U' },
        { id: 7, title: 'Chapter 7: समासाः', videoId: 'L-a2w7heyOE' },
        { id: 8, title: 'Chapter 8: प्रत्ययाः', videoId: '2t4W2FixwDE' },
        { id: 9, title: 'Chapter 9: अव्ययानि', videoId: 'NbkDzTDtHTs' },
        { id: 10, title: 'Chapter 10: समयः', videoId: 'o5I_lGrJRfk' },
        { id: 11, title: 'Chapter 11: वाक्यम्', videoId: '5kIuyfPFTTI' },
        { id: 12, title: 'Chapter 12: अशुद्धिसंशोधनम्', videoId: 'ngKANom6TpY' }
    ],
        'std_10_sanskrit_Shemushi': [
        { id: 1, title: 'Chapter 1: शुचिपर्यावरणम्', videoId: 'aCEuTHPBTIc' },
        { id: 2, title: 'Chapter 2: बुद्धिर्बलवती सदा', videoId: 'UPLZ9h_OqTk' },
        { id: 3, title: 'Chapter 3: शिशुलालनम्', videoId: 'KFWEwg6MLqU' },
        { id: 4, title: 'Chapter 4: जननी तुल्यवत्सला', videoId: 'SMmi5a8V2DM' },
        { id: 5, title: 'Chapter 5: सुभाषितानि', videoId: 'a6-g8FL2ztc' },
        { id: 6, title: 'Chapter 6: सौहार्दं प्रकृतेः शोभा', videoId: 'Wmc7M9c-hko' },
        { id: 7, title: 'Chapter 7: विचित्रः साक्षी', videoId: 'OpIt3CmeChM' },
        { id: 8, title: 'Chapter 8: सूक्तयः', videoId: 'gAgaaApj1Rs' },
        { id: 9, title: 'Chapter 9: भूकम्पविभीषिका', videoId: 'FeaqJllbxLE' },
        { id: 10, title: 'Chapter 10: अन्योक्तयः', videoId: 'z2TD9a2VbTc' }
    ],
    'std_10_sanskrit_Vyakaranavithi': [
        { id: 1, title: 'Chapter 1: वर्ण विचार', videoId: 'WsniTmUJ-gM' },
        { id: 2, title: 'द्वितीय – संज्ञा एवं परिभाषा प्रकरण', videoId: 'bkwdyHQIg30' },
        { id: 3, title: 'Chapter 2: सन्धि', videoId: 'Cf4JOB4IHjM' },
        { id: 4, title: '1. स्वर (अच्) सन्धि', videoId: 'oJtQZeQeUpA' },
        { id: 5, title: '2. व्यंजन (हल्) सन्धि', videoId: 'CrDCNzqntYI' },
        { id: 6, title: '3. विसर्ग सन्धि', videoId: 'N4g3WzxHpDM' },
        { id: 7, title: 'Chapter 4: शब्दरूप सामान्य परिचय', videoId: '2n6gMU5ULVU' },
        { id: 8, title: 'Chapter 5: धातुरूप सामान्य परिचय', videoId: 'trddENyyVwY' },
        { id: 9, title: 'Chapter 6: उपसर्ग', videoId: 'IpoKBo56uwc' },
        { id: 10, title: 'Chapter 7: अव्यय', videoId: 'RKxk9WU6sE4' },
        { id: 11, title: 'Chapter 9: प्रत्यय', videoId: '7m9T9wTSW2c' },
        { id: 12, title: 'कृत प्रत्यय & तद्धित प्रत्यय', videoId: '8zQPtYco7WQ' },
        { id: 13, title: '3. स्त्री प्रत्यय', videoId: 'CbLuzsMwxFE' },
        { id: 14, title: 'Chapter 9: समास परिचय', videoId: '9SCQcEp4ayg' },
        { id: 15, title: 'Chapter 10: कारक और विभक्ति', videoId: 'VHca-7RFtsA' },
        { id: 16, title: 'Chapter 11: वाच्य परिवर्तन', videoId: '8WMoETdh8hs' },
        { id: 17, title: 'Chapter 12: रचना प्रयोग', videoId: 'X3ujacE2-6E' },
        { id: 18, title: 'पत्र', videoId: 'O6P7xhY3BSs' },
        { id: 19, title: 'अपठित गद्यांश', videoId: '4x0J2n2M1uI' },
        { id: 20, title: 'अनुच्छेदलेखनम्', videoId: '9dOwIj_41E8' },
        { id: 21, title: 'शब्दरूपाणि', videoId: 'Da66vjZGQtQ' },
        { id: 22, title: 'धातुरूपाणि', videoId: 'jw_61vI6XYA' }
    ]
};

/* ── Circular SVG Progress Ring ─────────────────────────── */
function CircleRing({ pct }) {
    const r = 32, circ = 2 * Math.PI * r;
    return (
        <svg width="84" height="84" viewBox="0 0 84 84">
            <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
            </defs>
            <circle cx="42" cy="42" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <motion.circle
                cx="42" cy="42" r={r}
                fill="none" stroke="url(#ringGrad)" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                transform="rotate(-90 42 42)"
            />
            <text x="42" y="47" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
                {pct}%
            </text>
        </svg>
    );
}

/* ── Subject KPI Card (per-subject strip) ────────────────── */
function SubjectKpiCard({ book }) {
    const navigate = useNavigate();
    const { title, icon, iconBg, iconColor, badgeColor, progress, chapters, completedCount } = book;
    const status   = progress === 100 ? 'Done' : progress > 0 ? 'In Progress' : 'Not Started';
    const statusBg = progress === 100 ? '#dcfce7' : progress > 0 ? '#eff6ff' : '#f1f5f9';
    const statusCl = progress === 100 ? '#15803d' : progress > 0 ? '#2563eb'  : '#94a3b8';
    return (
        <motion.div
            className="sk-card"
            whileHover={{ y: -4, boxShadow: '0 14px 32px rgba(0,0,0,0.11)' }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate(`/books/${book.slug}`)}
            style={{ cursor: 'pointer' }}
            title={title}
        >
            <div className="sk-card__icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
            <div className="sk-card__title">{title}</div>
            <div className="sk-card__bar-wrap">
                <motion.div
                    className="sk-card__bar"
                    style={{ background: iconColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            <div className="sk-card__pct" style={{ color: iconColor }}>{progress}%</div>
            <div className="sk-card__chapters">{completedCount} / {chapters} ch</div>
            <span className="sk-card__status" style={{ color: statusCl, background: statusBg }}>{status}</span>
        </motion.div>
    );
}

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ icon, iconBg, label, value, sub, ring, pct }) {
    return (
        <motion.div
            className="sc-kpi"
            whileHover={{ scale: 1.04, boxShadow: '0 16px 36px rgba(0,0,0,0.11)' }}
            transition={{ duration: 0.22 }}
        >
            {ring ? (
                <>
                    <div className="sc-kpi__label">{label}</div>
                    <CircleRing pct={pct} />
                </>
            ) : (
                <>
                    <div className="sc-kpi__icon" style={{ background: iconBg }}>{icon}</div>
                    <div className="sc-kpi__label">{label}</div>
                    <div className="sc-kpi__val">{value}</div>
                    {sub && <div className="sc-kpi__sub">{sub}</div>}
                </>
            )}
        </motion.div>
    );
}

/* ── Subject Card ─────────────────────────────────────────── */
function SubjectCard({ book, isFav, onFavToggle }) {
    const navigate = useNavigate();

    const handleDownload = async (e) => {
        e.stopPropagation();
        try {
            const resp = await apiService.downloadAllPdfs(book.slug);
            const url  = URL.createObjectURL(resp.data);
            const link = document.createElement('a');
            link.href     = url;
            link.download = `${book.title.replace(/\s+/g, '_')}_Full.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            alert('No PDFs available for download yet.');
        }
    };
    const {
        id, title, icon, iconBg, iconColor,
        badgeColor, badgeBg,
        progress, chapters, lastOpened,
    } = book;

    const btnLabel =
        chapters === 0   ? 'Explore' :
        progress === 100 ? 'Review' :
        progress > 0     ? 'Continue' :
                           'Start Learning';

    const subtitle = chapters === 0
        ? 'Coming Soon'
        : lastOpened
            ? `${chapters} Chapters • Last opened ${lastOpened}`
            : `${chapters} Chapters`;
    return (
        <motion.div
            className="sc-card"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.13)' }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate(`/books/${book.slug}`)}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={`Open ${title} subject page`}
        >
            {/* Image replaced to the old icon emoji */}
            <div
                className="sc-card__icon-circle"
                style={{ background: iconBg, color: iconColor }}
            >
                {icon}
            </div>

            {/* Title */}
            <h3 className="sc-card__title">{title}</h3>

            {/* Subtitle */}
            <p className="sc-card__subtitle">{subtitle}</p>

            {/* Completion / status badge */}
            <span
                className="sc-card__badge"
                style={chapters === 0
                    ? { color: '#92400e', background: '#fef3c7' }
                    : { color: badgeColor, background: badgeBg }
                }
                aria-label={chapters === 0 ? 'Coming soon' : `${progress}% completed`}
            >
                {chapters === 0 ? '🔒 Coming Soon' : `${progress}% Completed`}
            </span>

            {/* Actions */}
            <div className="sc-card__actions">
                {/* Heart */}
                <button
                    className={`sc-card__icon-btn${isFav ? ' sc-card__icon-btn--fav' : ''}`}
                    onClick={e => { e.stopPropagation(); onFavToggle(id); }}
                    aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                >
                    {isFav ? '❤️' : '🤍'}
                </button>

                {/* CTA */}
                <motion.button
                    className="sc-card__cta"
                    style={{ background: iconColor }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/books/${book.slug}`)}
                    aria-label={`${btnLabel} ${title}`}
                >
                    {btnLabel}
                </motion.button>

                {/* Download */}
                <button
                    className="sc-card__icon-btn"
                    onClick={handleDownload}
                    aria-label={`Download ${title}`}
                    title={`Download all PDFs for ${title}`}
                >
                    ⬇️
                </button>
            </div>
        </motion.div>
    );
}

/* ── Video Card (matches SubjectCard theme) ───────────────── */
const VideoCard = forwardRef(function VideoCard({ book, onClick }, ref) {
    const { title, icon, iconBg, iconColor, badgeColor, badgeBg } = book;

    return (
        <motion.div
            ref={ref}
            className="sc-card"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.13)' }}
            transition={{ duration: 0.25 }}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={`Open videos for ${title}`}
        >
            <div
                className="sc-card__icon-circle"
                style={{ background: iconBg, color: iconColor }}
            >
                {icon}
            </div>

            <h3 className="sc-card__title">{title} Videos</h3>
            <p className="sc-card__subtitle">Chapter-wise Video Lessons</p>

            <span
                className="sc-card__badge"
                style={{ color: '#ef4444', background: '#fee2e2' }}
            >
                YouTube Courses
            </span>

            <div className="sc-card__actions" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <motion.button
                    className="sc-card__cta"
                    style={{ background: '#ef4444', width: '100%' }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    aria-label={`Watch ${title} Videos`}
                >
                    Learning Video
                </motion.button>
            </div>
        </motion.div>
    );
});

VideoCard.displayName = 'VideoCard';

/* ── Video Player View (Safe Mode) ────────────────────────── */
function VideoPlayerView({ book, chapter, onBack }) {
    return (
        <motion.div 
            className="vp-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <div className="vp-header-bar">
                <button className="video-back-btn" onClick={onBack}>← Back to Chapters</button>
            </div>
            
            <div className="vp-player-card">
                <div className="vp-card-header">
                    <div className="vp-play-icon">▶</div>
                    <div className="vp-card-titles">
                        <h3>{chapter.title}</h3>
                        <p>Now Playing · Safe Mode</p>
                    </div>
                </div>

                <div className="vp-safe-badge">
                    <span className="vp-dot"></span> Now Playing — Safe Learning Mode
                </div>

                <div className="vp-video-wrapper">
                    <iframe 
                        src={`https://www.youtube-nocookie.com/embed/${chapter.videoId}?autoplay=1&rel=0&modestbranding=1`}
                        title={chapter.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="vp-safe-footer">
                    <span className="vp-dot"></span> Safe viewing · No external links · Privacy-enhanced mode
                </div>
            </div>
        </motion.div>
    );
}

/* ── Video Chapter View ───────────────────────────────────── */
function VideoChapterView({ book, onBack }) {
    const [activeChapter, setActiveChapter] = useState(null);

    const chapters = useMemo(() => {
        return (VIDEO_DATA[book.slug] || []).map(v => ({
            ...v,
            thumb: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`
        }));
    }, [book.slug]);

    if (activeChapter) {
        return <VideoPlayerView book={book} chapter={activeChapter} onBack={() => setActiveChapter(null)} />;
    }

    if (chapters.length === 0) {
        return (
            <div className="video-chapter-view">
                <div className="video-chapter-header">
                    <div className="video-chapter-title-area">
                        <button className="video-back-btn icon-only" onClick={onBack} title="Back to Subjects">←</button>
                        <div className="vcta-icon" style={{ background: book.iconBg, color: book.iconColor }}>{book.icon}</div>
                        <div>
                            <h2>{book.title} Learning Units</h2>
                            <p>0 lessons</p>
                        </div>
                    </div>
                </div>
                <div className="sc-empty" style={{ marginTop: '20px' }}>
                    <span>📭</span>
                    <p>No videos mapped for this subject yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="video-chapter-view">
            <div className="video-chapter-header">
                <div className="video-chapter-title-area">
                    <button className="video-back-btn icon-only" onClick={onBack} title="Back to Subjects">←</button>
                    <div className="vcta-icon" style={{ background: book.iconBg, color: book.iconColor }}>{book.icon}</div>
                    <div>
                        <h2>{book.title} Learning Units</h2>
                        <p>{chapters.length} lessons</p>
                    </div>
                </div>
            </div>
            
            <div className="video-chapter-grid">
                {chapters.map(ch => (
                    <motion.div key={ch.id} className="vc-card" whileHover={{ y: -4 }}>
                        <img src={ch.thumb} alt={ch.title} className="vc-thumb" />
                        <div className="vc-info">
                            <h4>{ch.title}</h4>
                            <button 
                                className="vc-watch-btn"
                                onClick={() => setActiveChapter(ch)}
                            >
                                ▶ Watch Video
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ── Main Component ───────────────────────────────────────── */
export default function Books() {
    const navigate  = useNavigate();
    const user      = useSelector((state) => state.auth.user);
    const [filter,    setFilter]    = useState('All Books');
    const [search,    setSearch]    = useState('');
    const [favorites, setFavorites] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('bookFavorites') || '[]')); }
        catch { return new Set(); }
    });
    const [apiSubjects, setApiSubjects] = useState([]);  // from /api/books
    const [loadingApi, setLoadingApi]   = useState(true);
    const [viewMode, setViewMode]       = useState('books'); // 'books' or 'videos'
    const [activeVideoBook, setActiveVideoBook] = useState(null);

    /* ── Fetch real data from API ── */
    const fetchSubjects = useCallback(async () => {
        setLoadingApi(true);
        try {
            const { data } = await apiService.getAllSubjects();
            setApiSubjects(data);
        } catch {
            // Fallback: no API data, use metadata only
        } finally {
            setLoadingApi(false);
        }
    }, []);

    useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

    /* ── Merge API data into metadata ── */
    const BOOKS = useMemo(() => {
        return BOOKS_META.map(meta => {
            const api = apiSubjects.find(s => s.slug === meta.slug);
            const chapters = api?.count || 0;
            const completedCount = api?.completedCount || 0;
            const progress = chapters > 0 ? Math.round((completedCount / chapters) * 100) : 0;
            const lastOpenedAt = api?.lastOpenedAt || null;
            const hasVideo = (VIDEO_DATA[meta.slug] || []).length > 0;

            // Format last opened as relative time
            let lastOpened = null;
            if (progress === 100) {
                lastOpened = 'Completed';
            } else if (lastOpenedAt) {
                const diff = Date.now() - new Date(lastOpenedAt).getTime();
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                if (hours < 1) lastOpened = 'just now';
                else if (hours < 24) lastOpened = `${hours}h ago`;
                else if (days === 1) lastOpened = 'yesterday';
                else if (days < 7) lastOpened = `${days} days ago`;
                else lastOpened = `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
            }

            return {
                ...meta,
                chapters,
                completedCount,
                progress,
                lastOpened,
                hasVideo,
            };
        }); // Removing .filter(b => b.chapters > 0) to show all 16 subjects
    }, [apiSubjects]);

    // KPI totals — based on actually available books
    const totalCompleted = useMemo(() => BOOKS.filter(b => b.progress === 100).length, [BOOKS]);
    const avgProgress    = useMemo(() => {
        const withChapters = BOOKS.filter(b => b.chapters > 0);
        return withChapters.length > 0
            ? Math.round(withChapters.reduce((s, b) => s + b.progress, 0) / withChapters.length)
            : 0;
    }, [BOOKS]);
    const chaptersRead   = useMemo(() => BOOKS.reduce((s, b) => s + (b.completedCount || 0), 0), [BOOKS]);
    const totalChapters  = useMemo(() => BOOKS.reduce((s, b) => s + (b.chapters || 0), 0), [BOOKS]);

    const visible = useMemo(() => {
        const q = search.toLowerCase();
        return BOOKS.filter(b => {
            const matchSearch = !q || b.title.toLowerCase().includes(q) || b.subject.toLowerCase().includes(q);
            if (!matchSearch) return false;
            switch (filter) {
                case 'Completed':       return b.progress === 100;
                case 'Favorites':       return favorites.has(b.id);
                case 'Pending':         return b.progress === 0;
                case 'Recently Opened': return b.lastOpened !== null && b.progress < 100;
                default:                return true;
            }
        });
    }, [filter, search, favorites, BOOKS]);

    const videoVisible = useMemo(() => {
        const q = search.toLowerCase();
        return BOOKS.filter(b => {
            const matchSearch = !q || b.title.toLowerCase().includes(q) || b.subject.toLowerCase().includes(q);
            return matchSearch && b.hasVideo;
        });
    }, [BOOKS, search]);

    const toggleFav = id => setFavorites(prev => {
        const s = new Set(prev);
        s.has(id) ? s.delete(id) : s.add(id);
        localStorage.setItem('bookFavorites', JSON.stringify([...s]));
        return s;
    });

    return (
        <div className="sc-wrapper">

            {/* ── KPI Row ── */}
            <div className="sc-kpi-row">
                <KpiCard icon="📚" iconBg="#EFF6FF" label="Total Books"     value={BOOKS.length} />
                <KpiCard icon="✅" iconBg="#F0FDF4" label="Completed"       value={totalCompleted} />
                <KpiCard ring pct={avgProgress}     label="Overall Progress" value={`${avgProgress}%`} />
                <KpiCard icon="📖" iconBg="#F5F3FF" label="Chapters Read"   value={chaptersRead} sub={`of ${totalChapters}`} />
            </div>

            {/* ── Toolbar ── */}
            {!activeVideoBook && (
                <div className="sc-toolbar">
                    <div className="sc-search-wrap">
                        <span className="sc-search-icon">🔍</span>
                        <input
                            className="sc-search"
                            placeholder="Search subjects..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            aria-label="Search subjects"
                        />
                        {search && (
                            <button className="sc-search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
                        )}
                    </div>
                    <div className="sc-filters" role="tablist" aria-label="Filter books">
                        {FILTERS.map(f => (
                            <motion.button
                                key={f}
                                role="tab"
                                aria-selected={filter === f}
                                className={`sc-filter${filter === f ? ' sc-filter--active' : ''}`}
                                onClick={() => { setFilter(f); setViewMode('books'); setActiveVideoBook(null); }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {f}
                            </motion.button>
                        ))}
                        <motion.button
                            type="button"
                            className={`sc-filter sc-filter--youtube ${viewMode === 'videos' ? 'sc-filter--active' : ''}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#fee2e2', backgroundColor: viewMode === 'videos' ? '#fee2e2' : '#fef2f2', cursor: 'pointer' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setViewMode(viewMode === 'books' ? 'videos' : 'books');
                                setActiveVideoBook(null);
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            {viewMode === 'videos' ? 'Back to Books' : 'Video Learning'}
                        </motion.button>
                    </div>
                </div>
            )}

            {/* ── Grid or Video Chapter View ── */}
            {activeVideoBook ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <VideoChapterView
                        book={activeVideoBook}
                        onBack={() => setActiveVideoBook(null)}
                    />
                </motion.div>
            ) : viewMode === 'videos' ? (
                videoVisible.length === 0 ? (
                    <div className="sc-empty">
                        <span>📭</span>
                        <p>No videos found{search ? ` for "${search}"` : ''}</p>
                    </div>
                ) : (
                    <motion.div layout className="sc-grid sc-grid--videos" role="list" aria-label="Available videos">
                        <AnimatePresence mode="popLayout">
                            {videoVisible.map((book, i) => (
                                <motion.div
                                    key={`video-${book.id}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.2, delay: i * 0.02 }}
                                >
                                    <VideoCard
                                        book={book}
                                        onClick={() => setActiveVideoBook(book)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )
            ) : visible.length === 0 ? (
                <div className="sc-empty">
                    <span>📭</span>
                    <p>No books found{search ? ` for "${search}"` : ` in "${filter}"`}</p>
                </div>
            ) : (
                <motion.div className="sc-grid" layout>
                    <AnimatePresence mode="popLayout">
                        {visible.map((book, i) => (
                            <motion.div
                                key={book.id + (viewMode === 'videos' ? '-video' : '-book')}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.22, delay: i * 0.025 }}
                            >
                                <SubjectCard
                                    book={book}
                                    isFav={favorites.has(book.id)}
                                    onFavToggle={toggleFav}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
