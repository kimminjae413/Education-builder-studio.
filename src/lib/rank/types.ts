export enum InstructorRank {
  NEWCOMER = 'newcomer',
  JUNIOR = 'junior',
  INTERMEDIATE = 'intermediate',
  SENIOR = 'senior',
  VETERAN = 'veteran',
  MASTER = 'master',
}

export interface RankInfo {
  rank: InstructorRank
  label: string
  icon: string
  color: string
  bgColor: string
  description: string
  aiLimit: number | null // null = 무제한
  uploadLimit: number | null
  rewardMultiplier: number
}

export const RANK_INFO: Record<InstructorRank, RankInfo> = {
  [InstructorRank.NEWCOMER]: {
    rank: InstructorRank.NEWCOMER,
    label: '새싹 강사',
    icon: '🌱',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: '이제 막 시작하는 단계입니다',
    aiLimit: 10,
    uploadLimit: 5,
    rewardMultiplier: 0,
  },
  [InstructorRank.JUNIOR]: {
    rank: InstructorRank.JUNIOR,
    label: '초급 강사',
    icon: '📘',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: '기본을 다지는 중입니다',
    aiLimit: 30,
    uploadLimit: 20,
    rewardMultiplier: 1.0,
  },
  [InstructorRank.INTERMEDIATE]: {
    rank: InstructorRank.INTERMEDIATE,
    label: '중급 강사',
    icon: '📗',
    color: 'text-cobalt-600',
    bgColor: 'bg-cobalt-50',
    description: '안정적으로 성장하고 있습니다',
    aiLimit: 100,
    uploadLimit: 50,
    rewardMultiplier: 1.2,
  },
  [InstructorRank.SENIOR]: {
    rank: InstructorRank.SENIOR,
    label: '고급 강사',
    icon: '📕',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: '전문성을 인정받았습니다',
    aiLimit: null,
    uploadLimit: null,
    rewardMultiplier: 1.5,
  },
  [InstructorRank.VETERAN]: {
    rank: InstructorRank.VETERAN,
    label: '베테랑 강사',
    icon: '🏆',
    color: 'text-gold-500',
    bgColor: 'bg-gold-50',
    description: '커뮤니티를 이끄는 리더입니다',
    aiLimit: null,
    uploadLimit: null,
    rewardMultiplier: 2.0,
  },
  [InstructorRank.MASTER]: {
    rank: InstructorRank.MASTER,
    label: '마스터 강사',
    icon: '💎',
    color: 'text-indigo-600',
    bgColor: 'bg-gradient-to-r from-indigo-50 to-purple-50',
    description: '최고의 교육 전문가입니다',
    aiLimit: null,
    uploadLimit: null,
    rewardMultiplier: 3.0,
  },
}
