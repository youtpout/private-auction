import {
    Bool,
    DynamicProof,
    FeatureFlags,
    Field,
    MerkleTree,
    MerkleWitness,
    Proof,
    PublicKey,
    SelfProof,
    Struct,
    VerificationKey,
    ZkProgram,
    verify,
} from 'o1js';


const sideloadedProgram = ZkProgram({
    name: 'childProgram',
    publicInput: PublicKey,
    methods: {
        canBid: {
            privateInputs: [Bool],
            async method(publicInput: PublicKey, privateInput: Bool) {
                privateInput.assertTrue("No kyc");
            },
        }
    },
});

// given a zkProgram, we compute the feature flags that we need in order to verify proofs that were generated
const featureFlags = await FeatureFlags.fromZkProgram(sideloadedProgram);

export class SideloadedProgramProof extends DynamicProof<PublicKey, void> {
    static publicInputType = Field;
    static maxProofsVerified = 0 as const;

    // we use the feature flags that we computed from the `sideloadedProgram` ZkProgram
    static featureFlags = featureFlags;
}


class MainProgramState extends Struct({
    address: PublicKey,
    vkHash: Field,
}) { }

export const mainProgram = ZkProgram({
    name: 'mainProgram',
    publicInput: MainProgramState,
    methods: {
        validateProof: {
            privateInputs: [
                VerificationKey,
                SideloadedProgramProof
            ],
            async method(
                publicInput: MainProgramState,
                vk: VerificationKey,
                proof: SideloadedProgramProof
            ) {
                proof.publicInput.assertEquals(publicInput.address);
                const vkHash = vk.hash;
                vkHash.assertEquals(publicInput.vkHash);
                proof.verify(vk);
            },
        },
    },
});

export let MainProof_ = ZkProgram.Proof(mainProgram);
export class MainProof extends MainProof_ { }