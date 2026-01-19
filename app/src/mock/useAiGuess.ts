type AiGuessResult = { isCorrect: boolean; message: string }

export const useAiGuess = () => {
  return {
    guess: async (_roomId: string, text: string): Promise<AiGuessResult> => {
      // mock API call delay
      await new Promise((res) => setTimeout(res, 300))
      const keywords = ['苹果', '彩虹', '吉他', '长颈鹿']
      const hit = keywords.some((w) => text.includes(w))
      return {
        isCorrect: hit,
        message: hit ? 'AI判定：命中词汇！' : 'AI判定：未命中，可尝试更具体描述',
      }
    },
  }
}
