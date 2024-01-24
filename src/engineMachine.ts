import { and, assign, fromCallback, raise, setup } from 'xstate';
import { AbsolutePath } from './core/FileSystem/Path.ts';
// import { Console } from 'effect';

type StoreType = 'git';
type StoreTypeNullable = StoreType | null;

type StoreRemoteStatus = 'live' | 'offline' | false;
type StoreRemoteStatusNullable = StoreRemoteStatus | null;

type InheritMachineParam = string | false;

type EngineCommand = 'add' | 'inherit' | 'init' | 'sync';
type EngineParams = {
  addFilePath?: AbsolutePath,
  initStoreNew?: boolean,
  inheritMachine?: InheritMachineParam
  initStoreJoinURI?: string,
  initStoreType?: StoreType,
};

type CallbackInput<Input> = { input: Input } & Parameters<Parameters<typeof fromCallback>[0]>[0];

export const engineMachine = setup({
  actions: {
    'raiseCommand': raise(({ context }) => ({
      type: context.command
    })),
    'setCommonHasChanges': assign({
      'store': ({ context }, params: { commonHasChanges: boolean }) => ({
        ...context.store,
        common: {
          ...context.store.common,
          hasChanges: params.commonHasChanges
        }
      }),
    }),
    'setShadowHasChanges': assign({
      'store': ({ context }, params: { shadowHasChanges: boolean }) => ({
        ...context.store,
        shadow: {
          ...context.store.shadow,
          hasChanges: params.shadowHasChanges
        }
      }),
    }),
    'setStoreInitialized': assign({
      'store': ({ context }, params: { storeType: StoreType }) => ({
        ...context.store,
        type: params.storeType,
        initialized: true
      }),
    }),
    'setStoreRemote': assign({
      'store': ({ context }, params: { storeRemoteStatus: StoreRemoteStatus }) => ({
        ...context.store,
        remoteStatus: params.storeRemoteStatus
      }),
    }),
  },
  actors: {
    'fileAdder': fromCallback(({ sendBack, input }: CallbackInput<{
      addFilePath: AbsolutePath | undefined,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeCreator': fromCallback(({ sendBack, input }: CallbackInput<{
      storeType: StoreType | undefined,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeDeployer': fromCallback(({ sendBack, input }: CallbackInput<{
      shadowHasChanges: boolean,
      storeType: StoreType,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeInheriter': fromCallback(({ sendBack, input }: CallbackInput<{
      inheritMachine: InheritMachineParam | undefined,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeInitializer': fromCallback(({ sendBack, input }: CallbackInput<{
      newStore: boolean | undefined,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeJoiner': fromCallback(({ sendBack, input }: CallbackInput<{
      command: EngineCommand,
      inheritMachine: InheritMachineParam | undefined,
      joinType: StoreType | undefined,
      joinURI: string | undefined,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeMerger': fromCallback(({ sendBack, input }: CallbackInput<{
      commonHasChanges: boolean,
      shadowHasChanges: boolean,
      storeType: StoreType,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeRefresher': fromCallback(({ sendBack, input }: CallbackInput<{
      storeType: StoreType,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeSynchronizer': fromCallback(({ sendBack, input }: CallbackInput<{
      shadowHasChanges: boolean,
      storeType: StoreType,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeTranscriber': fromCallback(({ sendBack, input }: CallbackInput<{
      commonHasChanges: boolean,
      storeType: StoreType,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    }),
    'storeUploader': fromCallback(({ sendBack, input }: CallbackInput<{
      shadowHasChanges: boolean,
      storeType: StoreType,
    }>) => {
      // ...

      return () => {
        // cleanup
      }
    })
  },
  guards: {
    'canSynchronize': and([
      ({ context }) => !context.store.common.hasChanges,
      ({ context }) => context.store.remoteStatus === 'live',
    ]),
    'storeInitialized': ({ context }) => context.store.initialized,
    'inheritCommand': ({ context }) => context.command === 'inherit',
    'isLiveRemote': ({ context }) => context.store.remoteStatus === 'live',
  },
  types: {
    context: {} as {
      command: EngineCommand,
      store: {
        type: StoreTypeNullable,
        common: {
          hasChanges: boolean | null,
        },
        shadow: {
          hasChanges: boolean | null,
        },
        initialized: boolean,
        remoteStatus: StoreRemoteStatusNullable,
      },
      params: EngineParams,
    },
    events: {} as
      | { type: 'add' }
      | { type: 'create' }
      | { type: 'fail' }
      | { type: 'inherit' }
      | { type: 'inheritStoreInitialized',
          storeType: StoreType,
        }
      | { type: 'init' }
      | { type: 'join',
          inheritMachine: InheritMachineParam,
        }
      | { type: 'succeed', }
      | { type: 'succeedMerging',
          commonHasChanges: boolean,
        }
      | { type: 'succeedRefreshing',
          storeRemoteStatus: StoreRemoteStatus,
          commonHasChanges: boolean,
        }
      | { type: 'succeedStoreInitialized',
          storeType: StoreType,
        }
      | { type: 'succeedTranscribing',
          shadowHasChanges: boolean,
        }
      | { type: 'sync', }
    ,
    input: {} as {
      command: EngineCommand,
      params: EngineParams,
      storeInitialized: boolean,
      storeType: StoreTypeNullable,
    },
  }
}).createMachine({
  id: 'engine',
  initial: 'cli',
  states: {
    'cli': {
      initial: 'ready',
      states: {
        'ready': {
          entry: {
            type: 'raiseCommand',
          },
          on: {
            'init': {
              target: 'preInit'
            },
            'sync': {
              target: 'preSync'
            },
            'add': {
              target: 'preAdd'
            },
            'inherit': {
              target: 'preInherit'
            }
          }
        },
        'preInit': {
          always: [
            {
              target: '#engine.exit',
              guard: 'storeInitialized'
            },
            {
              target: '#engine.initializingStore'
            }
          ]
        },
        'preSync': {
          always: [
            {
              target: 'syncingStore',
              guard: 'storeInitialized'
            },
            {
              target: '#engine.initializingStore'
            }
          ]
        },
        'preAdd': {
          always: [
            {
              target: 'addingFile',
              guard: 'storeInitialized'
            },
            {
              target: '#engine.initializingStore'
            }
          ]
        },
        'preInherit': {
          always: [
            {
              target: 'inheriting',
              guard: 'storeInitialized'
            },
            {
              target: '#engine.initializingStore'
            }
          ]
        },
        'syncingStore': {
          initial: 'refreshing',
          states: {
            'refreshing': {
              description: "Attempt to fetch (refresh) data from the store's remote (if one exists).",
              invoke: {
                src: 'storeRefresher',
                input: ({ context }) => ({ storeType: context.store.type! }),
              },
              on: {
                'succeedRefreshing': {
                  actions: [
                    {
                      type: 'setStoreRemote',
                      params: ({ event }) => ({ storeRemoteStatus: event.storeRemoteStatus })
                    },
                    {
                      type: 'setCommonHasChanges',
                      params: ({ event }) => ({ commonHasChanges: event.commonHasChanges })
                    }
                  ],
                  target: 'transcribing',
                }
              }
            },
            'transcribing': {
              description: "Record state from active files into the shadow store\n\nIf \`store.common.hasChanges\`, the file list will need to be synthesized as a union of files from the shadow and common stores.\n\nThis is a \'transcription\' instead of a straightforward clone or mirror since transformations can be applied between the shadow store and active filesystem.",
              invoke: {
                src: 'storeTranscriber',
                input: ({ context }) => ({
                  commonHasChanges: context.store.common.hasChanges!,
                  storeType: context.store.type!,
                }),
              },
              on: {
                'succeedTranscribing': {
                  actions: {
                    type: 'setShadowHasChanges',
                    params: ({ event }) => ({ shadowHasChanges: event.shadowHasChanges })
                  },
                  target: 'merging',
                }
              }
            },
            'merging': {
              description: "Apply changes from the common store into the shadow store. Conflicts may result; causing a recoverable failure.",
              invoke: {
                src: 'storeMerger',
                input: ({ context }) => ({
                  commonHasChanges: context.store.common.hasChanges!,
                  shadowHasChanges: context.store.shadow.hasChanges!,
                  storeType: context.store.type!,
                }),
              },
              on: {
                'succeedMerging': {
                  actions: {
                    type: 'setCommonHasChanges',
                    params: ({ commonHasChanges: false })
                  },
                  target: 'deploying',
                },
                'fail': [
                  {
                    target: 'uploading',
                    guard: 'isLiveRemote'
                  },
                  {
                    target: '#engine.exit'
                  },
                ],
              }
            },
            'deploying': {
              description: "Translate stored representation in shadow store to deployed active files in the filesystem. Opposite of transcribing.",
              invoke: {
                src: 'storeDeployer',
                input: ({ context }) => ({
                  shadowHasChanges: context.store.shadow.hasChanges!,
                  storeType: context.store.type!,
                }),
              },
              on: {
                'succeed': [
                  {
                    target: 'synchronizing',
                    guard: 'canSynchronize'
                  },
                  {
                    target: 'uploading',
                    guard: 'isLiveRemote'
                  },
                  {
                    target: '#engine.exit'
                  }
                ]
              }
            },
            'synchronizing': {
              description: "Apply changes from the shadow store into the common store. This is only allowed if the remote store is live and can be uploaded to subsequently.",
              invoke: {
                src: 'storeSynchronizer',
                input: ({ context }) => ({
                  shadowHasChanges: context.store.shadow.hasChanges!,
                  storeType: context.store.type!,
                }),
              },
              on: {
                'succeed': {
                  target: 'uploading'
                }
              }
            },
            'uploading': {
              description: "If there exists a live remote store, upload any changes from the shadow store and the common store.",
              invoke: {
                src: 'storeUploader',
                input: ({ context }) => ({
                  shadowHasChanges: context.store.shadow.hasChanges!,
                  storeType: context.store.type!,
                }),
              },
              on: {
                'succeed': {
                  target: '#engine.exit'
                }
              }
            },
          }
        },
        'addingFile': {
          invoke: {
            src: 'fileAdder',
            input: ({ context: { params: { addFilePath }}}) => ({ addFilePath }),
          },
          on: {
            'succeed': {
              target: '#engine.exit'
            }
          }
        },
        'inheriting': {
          invoke: {
            src: 'storeInheriter',
            input: ({ context: { params: { inheritMachine }}}) => ({ inheritMachine }),
          },
          on: {
            'succeed': {
              target: '#engine.exit'
            }
          }
        },
        'resume': {
          history: 'shallow',
          type: 'history'
        }
      },
      on: {
        'fail': {
          target: 'error'
        }
      }
    },
    'error': {
      type: 'final'
    },
    'exit': {
      type: 'final'
    },
    'initializingStore': {
      initial: 'awaitingInitType',
      states: {
        'awaitingInitType': {
          invoke: {
            src: 'storeInitializer',
            input: ({ context }) => ({
              newStore: context.params.initStoreNew,
            }),
          },
          on: {
            'join': {
              target: 'joiningStore',
            },
            'create': {
              target: 'creatingStore'
            }
          }
        },
        'joiningStore': {
          invoke: {
            src: 'storeJoiner',
            input: ({ context }) => ({
              command: context.command,
              inheritMachine: context.params.inheritMachine,
              joinType: context.params.initStoreType,
              joinURI: context.params.initStoreJoinURI,
            }),
          },
          on: {
            'succeedStoreInitialized': {
              actions: {
                type: 'setStoreInitialized',
                params: ({ event }) => ({ storeType: event.storeType })
              },
              target: '#engine.cli.resume'
            },
            'inheritStoreInitialized': {
              actions: {
                type: 'setStoreInitialized',
                params: ({ event }) => ({ storeType: event.storeType })
              },
              target: 'inheriting'
            },
          },
        },
        'creatingStore': {
          invoke: {
            src: 'storeCreator',
            input: ({ context: { params: { initStoreType }}}) => ({ storeType: initStoreType })
          },
          on: {
            'succeedStoreInitialized': {
              actions: {
                type: 'setStoreInitialized',
                params: ({ event }) => ({ storeType: event.storeType })
              },
              target: '#engine.cli.resume'
            }
          }
        },
        'inheriting': {
          invoke: {
            src: 'storeInheriter',
            input: ({ context: { params: { inheritMachine }}}) => ({ inheritMachine }),
          },
          on: {
            'succeed': [
              {
                target: '#engine.exit',
                guard: 'inheritCommand'
              },
              {
                target: '#engine.cli.resume'
              }
            ]
          }
        }
      },
      on: {
        'fail': {
          target: 'error'
        }
      }
    }
  },
  context: ({ input }) => ({
    command: input.command,
    params: input.params,
    store: {
      type: input.storeType,
      common: {
        hasChanges: null
      },
      shadow: {
        hasChanges: null
      },
      initialized: input.storeInitialized,
      remoteStatus: null
    }
  }),
});
