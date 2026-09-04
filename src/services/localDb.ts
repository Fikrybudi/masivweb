// =============================================================================
// PLN SURVEY WEB - IndexedDB Local Storage Service (Offline-First)
// =============================================================================

import { get, set, del } from 'idb-keyval';
import { Survey } from '../types';

const SURVEYS_STORAGE_KEY = 'pln_surveys_offline_db';
const ACTIVE_SURVEY_KEY = 'pln_active_survey_id';

export const localDb = {
    async getAllSurveys(): Promise<Survey[]> {
        try {
            const surveys = await get<Survey[]>(SURVEYS_STORAGE_KEY);
            return surveys || [];
        } catch (err) {
            console.error('Error reading IndexedDB:', err);
            return [];
        }
    },

    async saveSurvey(survey: Survey): Promise<void> {
        const surveys = await this.getAllSurveys();
        const index = surveys.findIndex((s) => s.id === survey.id);
        if (index >= 0) {
            surveys[index] = { ...survey, updatedAt: new Date() };
        } else {
            surveys.unshift({ ...survey, createdAt: new Date(), updatedAt: new Date() });
        }
        await set(SURVEYS_STORAGE_KEY, surveys);
    },

    async getSurveyById(id: string): Promise<Survey | undefined> {
        const surveys = await this.getAllSurveys();
        return surveys.find((s) => s.id === id);
    },

    async deleteSurvey(id: string): Promise<void> {
        const surveys = await this.getAllSurveys();
        const filtered = surveys.filter((s) => s.id !== id);
        await set(SURVEYS_STORAGE_KEY, filtered);
    },

    async getActiveSurveyId(): Promise<string | undefined> {
        return await get<string>(ACTIVE_SURVEY_KEY);
    },

    async setActiveSurveyId(id: string): Promise<void> {
        await set(ACTIVE_SURVEY_KEY, id);
    }
};
