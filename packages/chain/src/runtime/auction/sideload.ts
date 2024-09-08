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


export const sideloadedProgram = ZkProgram({
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
    static publicInputType = PublicKey;
    static maxProofsVerified = 0 as const;

    // we use the feature flags that we computed from the `sideloadedProgram` ZkProgram
    static featureFlags = featureFlags;
}

export let SideProof_ = ZkProgram.Proof(sideloadedProgram);
export class SideProof extends SideProof_ { }


export class MainProgramState extends Struct({
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
                SideProof
            ],
            async method(
                publicInput: MainProgramState,
                vk: VerificationKey,
                proof: SideProof
            ) {
                proof.publicInput.assertEquals(publicInput.address);
                const vkHash = vk.hash;
                vkHash.assertEquals(publicInput.vkHash);
                proof.verify();
            },
        },
    },
});

export let MainProof_ = ZkProgram.Proof(mainProgram);
export class MainProof extends MainProof_ { }

