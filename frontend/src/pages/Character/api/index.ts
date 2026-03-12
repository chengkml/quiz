import axios from '@/core/src/http';

export interface CharacterCardDto {
    id: string;
    characterText: string;
    pinyin: string;
    mdDefinition: string;
    easinessFactor: number;
    interval: number;
    repetition: number;
    nextReviewDate: string;
    archived: boolean;
    totalReviewCount: number;
    lastScore: number | null;
    createDate: string;
    updateDate: string;
    createUser: string;
}

export interface CharacterCardCreateDto {
    characterText: string;
    pinyin?: string;
    mdDefinition: string;
}

export interface CharacterCardUpdateDto {
    id: string;
    characterText: string;
    pinyin?: string;
    mdDefinition: string;
}

export interface CharacterCardQueryDto {
    keyword?: string;
    archived?: boolean;
    minRepetition?: number;
    maxRepetition?: number;
    createDateStart?: string;
    createDateEnd?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
}

export interface ReviewRequestDto {
    id: string;
    score: number;
}

export const getCharacterList = (params: CharacterCardQueryDto) =>
    axios.post('/character/search', params);

export const createCharacter = (data: CharacterCardCreateDto) =>
    axios.post('/character/create', data);

export const updateCharacter = (data: CharacterCardUpdateDto) =>
    axios.put('/character/update', data);

export const streamGenerateDefinitionUrl = (params: any) => {
    const qs = [];
    if (params.characterText !== undefined) qs.push(`characterText=${encodeURIComponent(params.characterText)}`);
    if (params.modelName !== undefined) qs.push(`modelName=${encodeURIComponent(params.modelName)}`);
    return `/api/character/generate/stream?${qs.join('&')}`;
};

export const deleteCharacter = (id: string) =>
    axios.delete(`/character/delete/${id}`);

export const archiveCharacter = (id: string, archived: boolean = true) =>
    axios.post(`/character/archive/${id}`, null, { params: { archived } });

export const resetCharacter = (id: string) =>
    axios.post(`/character/reset/${id}`);

export const getDueToday = () =>
    axios.get('/character/due-today');

export const reviewCharacter = (data: ReviewRequestDto) =>
    axios.post('/character/review', data);
