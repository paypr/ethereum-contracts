import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { BASE_CONTRACT_ID, ERC165_ID, SKILL_CONSTRAINED_ID, SKILL_ID } from '../../../helpers/ContractIds';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { createConstrainedSkill } from '../../../helpers/SkillHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createConstrainedSkill, ERC165_ID);
  shouldSupportInterface('BaseContract', createConstrainedSkill, BASE_CONTRACT_ID);
  shouldSupportInterface('Skill', createConstrainedSkill, SKILL_ID);
  shouldSupportInterface('SkillConstrained', createConstrainedSkill, SKILL_CONSTRAINED_ID);
});

describe('currentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createConstrainedSkill();

    const currentLevel = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel).toEqual(0);
  });

  it('should get 0 when player has no levels', async () => {
    const skill = await createConstrainedSkill();

    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel).toEqual(0);
  });

  it('should get correct level when player has level', async () => {
    const skill = await createConstrainedSkill();

    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel1 = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel1).toEqual(2);

    const currentLevel2 = await toNumberAsync(skill.currentLevel(PLAYER2));
    expect<number>(currentLevel2).toEqual(1);
  });
});

describe('myCurrentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createConstrainedSkill();

    const currentLevel = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER1 }));
    expect<number>(currentLevel).toEqual(0);
  });

  it('should get 0 when player has no levels', async () => {
    const skill = await createConstrainedSkill();

    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel1 = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER1 }));
    expect<number>(currentLevel1).toEqual(0);
  });

  it('should get correct level when player has level', async () => {
    const skill = await createConstrainedSkill();

    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel1 = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER1 }));
    expect<number>(currentLevel1).toEqual(2);

    const currentLevel2 = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER2 }));
    expect<number>(currentLevel2).toEqual(1);
  });
});
